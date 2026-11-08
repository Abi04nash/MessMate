import { MealMenu } from "../models/MealMenu.js";
import { MealSession } from "../models/MealSession.js";
import { MealRegistration } from "../models/MealRegistration.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { User } from "../models/User.js";
import { SemesterEnrollment } from "../models/SemesterEnrollment.js";
import { ApiError } from "../utils/ApiError.js";
import { MEAL_SESSION_STATUS } from "../constants/statuses.js";

const DEFAULT_PRICES = { breakfast: 40, lunch: 80, snacks: 30, dinner: 90 };
const CATEGORY_ORDER = { breakfast: 1, lunch: 2, snacks: 3, dinner: 4 };

function startOfDayUTC(d) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

function parseTimeOnDate(date, hhmm) {
  const parts = hhmm.split(":").map(Number);
  const d = startOfDayUTC(date);
  d.setUTCHours(parts[0], parts[1], 0, 0);
  return d;
}

async function getSettingNumber(key, fallback) {
  const s = await SystemSetting.findOne({ key });
  return s ? Number(s.value) : fallback;
}

async function getPricing() {
  const s = await SystemSetting.findOne({ key: "billing.perMealPrice" });
  return s && s.value ? s.value : DEFAULT_PRICES;
}

async function getGroundFloorEnrollment(userId) {
  if (!userId) return null;
  const user = await User.findById(userId).select("messSystem").lean();
  if (!user || user.messSystem !== "ground_floor") return null;
  return SemesterEnrollment.findOne({ user: userId, status: "active" }).lean();
}

function injectGfStatus({ session, menuDate, gfEnrollment, realReg }) {
  if (realReg) return realReg;
  if (!gfEnrollment) return null;
  if (!gfEnrollment.meals.includes(session.category)) return null;

  const day = new Date(menuDate);
  const start = new Date(gfEnrollment.semesterStart);
  const end = new Date(gfEnrollment.semesterEnd);

  if (day < start || day > end) return null;

  return {
    _id: "gf:" + String(gfEnrollment._id),
    status: "registered",
    isGroundFloor: true
  };
}

function dedupeSessionsByCategory(sessions) {
  const seen = new Set();
  const out = [];
  for (const s of sessions) {
    if (seen.has(s.category)) continue;
    seen.add(s.category);
    out.push(s);
  }
  return out.sort((a, b) => (CATEGORY_ORDER[a.category] || 99) - (CATEGORY_ORDER[b.category] || 99));
}

function dedupeMenusByDay(menus) {
  const seen = new Set();
  const out = [];
  for (const m of menus) {
    const day = new Date(m.date).toISOString().slice(0, 10);
    if (seen.has(day)) continue;
    seen.add(day);
    out.push(m);
  }
  return out;
}

async function findMenuForDate(dateInput) {
  const target = startOfDayUTC(dateInput);
  const start = new Date(target.getTime() - 12 * 60 * 60 * 1000);
  const end = new Date(target.getTime() + 36 * 60 * 60 * 1000);
  const menus = await MealMenu.find({ date: { $gte: start, $lt: end } }).sort({ createdAt: -1 }).lean();
  if (menus.length === 0) return null;
  let best = menus[0];
  let bestDist = Math.abs(new Date(best.date).getTime() - target.getTime());
  for (const m of menus) {
    const dist = Math.abs(new Date(m.date).getTime() - target.getTime());
    if (dist < bestDist) { best = m; bestDist = dist; }
  }
  return best;
}

async function computeCutoffs(menuDate, meal, regCut, cancelCut) {
  const start = parseTimeOnDate(menuDate, meal.startTime);
  return {
    registrationCutoff: new Date(start.getTime() - regCut * 60000),
    cancellationCutoff: new Date(start.getTime() - cancelCut * 60000)
  };
}

async function syncSessionsForMenu(menu) {
  const regCut = await getSettingNumber("meals.registrationCutoffMinutes", 120);
  const cancelCut = await getSettingNumber("meals.cancellationCutoffMinutes", 60);
  const currentCategories = menu.meals.map((m) => m.category);

  const orphaned = await MealSession.find({ menu: menu._id, category: { $nin: currentCategories } });
  for (const s of orphaned) {
    await MealRegistration.updateMany(
      { session: s._id, status: "registered" },
      { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Menu updated" }
    );
    await MealSession.deleteOne({ _id: s._id });
  }

  for (const meal of menu.meals) {
    const cutoffs = await computeCutoffs(menu.date, meal, regCut, cancelCut);
    const existing = await MealSession.findOne({ menu: menu._id, category: meal.category });
    if (existing) {
      existing.startTime = meal.startTime;
      existing.endTime = meal.endTime;
      existing.registrationCutoff = cutoffs.registrationCutoff;
      existing.cancellationCutoff = cutoffs.cancellationCutoff;
      await existing.save();
    } else {
      await MealSession.create({
        menu: menu._id, date: menu.date, category: meal.category,
        startTime: meal.startTime, endTime: meal.endTime,
        registrationCutoff: cutoffs.registrationCutoff,
        cancellationCutoff: cutoffs.cancellationCutoff,
        status: MEAL_SESSION_STATUS.SCHEDULED
      });
    }
  }
}

export async function createMenu({ date, meals, notes, published, createdBy }) {
  const day = startOfDayUTC(date);
  const todayUTC = startOfDayUTC(new Date());
  if (day < todayUTC) throw new ApiError(400, "Menus cannot be created for past dates.");
  const existing = await findMenuForDate(day);
  if (existing) throw new ApiError(409, "A menu already exists for " + day.toDateString() + ". Edit it instead.");
  const menu = await MealMenu.create({
    date: day, meals, notes,
    published: !!published, publishedAt: published ? new Date() : undefined, createdBy
  });
  await syncSessionsForMenu(menu);
  return menu;
}

export async function updateMenu(id, updates) {
  const menu = await MealMenu.findById(id);
  if (!menu) throw new ApiError(404, "Menu not found");
  if (updates.meals) menu.meals = updates.meals;
  if (updates.notes !== undefined) menu.notes = updates.notes;
  if (updates.published !== undefined) {
    menu.published = updates.published;
    if (updates.published && !menu.publishedAt) menu.publishedAt = new Date();
  }
  await menu.save();
  if (updates.meals) await syncSessionsForMenu(menu);
  return menu;
}

export async function publishMenu(id) {
  const menu = await MealMenu.findById(id);
  if (!menu) throw new ApiError(404, "Menu not found");
  menu.published = true; menu.publishedAt = new Date();
  await menu.save();
  return menu;
}

export async function deleteMenu(id) {
  const menu = await MealMenu.findById(id);
  if (!menu) throw new ApiError(404, "Menu not found");
  const sessions = await MealSession.find({ menu: menu._id }).select("_id");
  const sessionIds = sessions.map((s) => s._id);
  if (sessionIds.length > 0) {
    await MealRegistration.updateMany(
      { session: { $in: sessionIds }, status: "registered" },
      { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Menu deleted" }
    );
    await MealSession.deleteMany({ menu: menu._id });
  }
  await MealMenu.deleteOne({ _id: menu._id });
  return menu;
}

export async function getMenuById(id) {
  const menu = await MealMenu.findById(id).lean();
  if (!menu) throw new ApiError(404, "Menu not found");
  const sessions = await MealSession.find({ menu: menu._id }).sort({ startTime: 1 }).lean();
  return { ...menu, sessions: dedupeSessionsByCategory(sessions) };
}

export async function getMenuByDate(date, { publishedOnly = true } = {}) {
  const menu = await findMenuForDate(date);
  if (!menu) return null;
  if (publishedOnly && !menu.published) return null;
  return menu;
}

export async function listMenus({ from, to, published, page = 1, limit = 50 } = {}) {
  const query = {};
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = startOfDayUTC(from);
    if (to) {
      const end = startOfDayUTC(to);
      end.setUTCDate(end.getUTCDate() + 1);
      query.date.$lt = end;
    }
  }
  if (published !== undefined) query.published = published;
  const skip = (Number(page) - 1) * Number(limit);
  const allMenus = await MealMenu.find(query).sort({ date: -1 }).lean();
  const deduped = dedupeMenusByDay(allMenus);
  const total = deduped.length;
  const menus = deduped.slice(skip, skip + Number(limit));
  return { menus, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

export async function getUpcomingMenus({ userId, days = 30, page = 1, limit = 3 } = {}) {
  const today = startOfDayUTC(new Date());
  const rangeStart = new Date(today.getTime() - 12 * 60 * 60 * 1000);
  const end = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { date: { $gte: rangeStart, $lte: end }, published: true };

  const allMenus = await MealMenu.find(filter).sort({ date: 1, createdAt: -1 }).lean();
  const dedupedMenus = dedupeMenusByDay(allMenus);
  const total = dedupedMenus.length;
  const paginatedMenus = dedupedMenus.slice(skip, skip + Number(limit));

  if (paginatedMenus.length === 0) return { menus: [], total: 0, page: Number(page), pages: 0 };

  const menuIds = paginatedMenus.map((m) => m._id);
  const allSessions = await MealSession.find({ menu: { $in: menuIds } }).sort({ startTime: 1 }).lean();
  const pricing = await getPricing();
  const gfEnrollment = await getGroundFloorEnrollment(userId);

  let regMap = new Map();
  if (userId) {
    const regs = await MealRegistration.find({
      user: userId,
      session: { $in: allSessions.map((s) => s._id) }
    }).lean();
    regMap = new Map(regs.map((r) => [String(r.session), r]));
  }

  const now = new Date();
  const sessionsByMenu = {};
  const menuDateMap = {};
  for (const m of paginatedMenus) {
    menuDateMap[String(m._id)] = m.date;
  }

  for (const s of allSessions) {
    const key = String(s.menu);
    if (!sessionsByMenu[key]) sessionsByMenu[key] = [];
    const regCut = s.registrationCutoff ? new Date(s.registrationCutoff) : null;
    const cancelCut = s.cancellationCutoff ? new Date(s.cancellationCutoff) : null;
    const realReg = regMap.get(String(s._id)) || null;
    const myRegistration = injectGfStatus({
      session: s,
      menuDate: menuDateMap[key],
      gfEnrollment,
      realReg
    });
    sessionsByMenu[key].push({
      ...s,
      unitPrice: Number(pricing[s.category]) || 0,
      registrationOpen: !regCut || now < regCut,
      cancellationOpen: !cancelCut || now < cancelCut,
      myRegistration
    });
  }

  const enriched = paginatedMenus.map((m) => {
    const rawSessions = sessionsByMenu[String(m._id)] || [];
    const dedupedSessions = dedupeSessionsByCategory(rawSessions);
    const itemsMap = {};
    for (const meal of m.meals || []) itemsMap[meal.category] = meal.items || [];
    return {
      ...m,
      sessions: dedupedSessions.map((s) => ({ ...s, items: itemsMap[s.category] || [] }))
    };
  });

  return { menus: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
}

export async function getTodaySessionsWithStatus(userId) {
  const today = startOfDayUTC(new Date());
  const menu = await findMenuForDate(today);
  const sessions = menu ? await MealSession.find({ menu: menu._id }).sort({ startTime: 1 }).lean() : [];

  if (sessions.length === 0) return [];

  const itemsMap = {};
  const specialMap = {};
  if (menu) {
    for (const m of menu.meals || []) {
      itemsMap[m.category] = m.items || [];
      specialMap[m.category] = !!m.special;
    }
  }

  const pricing = await getPricing();
  const gfEnrollment = await getGroundFloorEnrollment(userId);

  let regMap = new Map();
  if (userId) {
    const regs = await MealRegistration.find({
      user: userId,
      session: { $in: sessions.map((s) => s._id) }
    }).lean();
    regMap = new Map(regs.map((r) => [String(r.session), r]));
  }

  const now = new Date();
  const decorated = sessions.map((s) => {
    const regCut = s.registrationCutoff ? new Date(s.registrationCutoff) : null;
    const cancelCut = s.cancellationCutoff ? new Date(s.cancellationCutoff) : null;
    const realReg = regMap.get(String(s._id)) || null;
    const myRegistration = injectGfStatus({
      session: s,
      menuDate: menu.date,
      gfEnrollment,
      realReg
    });
    return {
      ...s,
      unitPrice: Number(pricing[s.category]) || 0,
      items: itemsMap[s.category] || [],
      special: specialMap[s.category] || false,
      registrationOpen: !regCut || now < regCut,
      cancellationOpen: !cancelCut || now < cancelCut,
      myRegistration
    };
  });

  return dedupeSessionsByCategory(decorated);
}

export async function cleanupDuplicateMenus() {
  const allMenus = await MealMenu.find().sort({ createdAt: -1 }).lean();
  const byDay = {};
  for (const m of allMenus) {
    const day = new Date(m.date).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(m);
  }
  const removed = [];
  for (const [day, dayMenus] of Object.entries(byDay)) {
    if (dayMenus.length <= 1) continue;
    const keep = dayMenus[0];
    const toRemove = dayMenus.slice(1);
    for (const m of toRemove) {
      const sessions = await MealSession.find({ menu: m._id }).select("_id");
      const sessionIds = sessions.map((s) => s._id);
      if (sessionIds.length > 0) {
        await MealRegistration.updateMany(
          { session: { $in: sessionIds }, status: "registered" },
          { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Duplicate menu cleanup" }
        );
        await MealSession.deleteMany({ menu: m._id });
      }
      await MealMenu.deleteOne({ _id: m._id });
      removed.push({ day, deletedId: String(m._id), keptId: String(keep._id) });
    }
  }
  return { totalDays: Object.keys(byDay).length, removed };
}

export async function dedupeSessionsInDB() {
  const allSessions = await MealSession.find().lean();
  const byMenuCategory = {};
  for (const s of allSessions) {
    const key = String(s.menu) + "|" + s.category;
    if (!byMenuCategory[key]) byMenuCategory[key] = [];
    byMenuCategory[key].push(s);
  }
  let removedCount = 0;
  for (const [, sessions] of Object.entries(byMenuCategory)) {
    if (sessions.length <= 1) continue;
    sessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const toRemove = sessions.slice(1);
    for (const s of toRemove) {
      await MealRegistration.updateMany(
        { session: s._id, status: "registered" },
        { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Duplicate session cleanup" }
      );
      await MealSession.deleteOne({ _id: s._id });
      removedCount++;
    }
  }
  return { removedCount };
}