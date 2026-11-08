import { sendSuccess } from "../utils/apiResponse.js";
import * as menuService from "../services/menuService.js";

export async function getTodayMenu(req, res, next) {
  try {
    const today = new Date();
    const menu = await menuService.getMenuByDate(today);
    const sessions = await menuService.getTodaySessionsWithStatus(req.userId);
    sendSuccess(res, { data: { menu: menu || null, sessions } });
  } catch (err) { next(err); }
}

export async function getMenuByDate(req, res, next) {
  try {
    const menu = await menuService.getMenuByDate(req.params.date, { publishedOnly: false });
    sendSuccess(res, { data: { menu: menu || null } });
  } catch (err) { next(err); }
}

export async function getUpcoming(req, res, next) {
  try {
    const result = await menuService.getUpcomingMenus({
      userId: req.user?._id || req.userId,
      days: Number(req.query.days) || 30,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 3
    });
    sendSuccess(res, {
      data: { menus: result.menus },
      meta: { total: result.total, page: result.page, pages: result.pages }
    });
  } catch (err) { next(err); }
}

export async function getDetail(req, res, next) {
  try {
    const menu = await menuService.getMenuById(req.params.id);
    sendSuccess(res, { data: { menu } });
  } catch (err) { next(err); }
}

export async function listMenus(req, res, next) {
  try {
    const result = await menuService.listMenus({
      from: req.query.from,
      to: req.query.to,
      published: req.query.published === "true" ? true : req.query.published === "false" ? false : undefined,
      page: req.query.page,
      limit: req.query.limit
    });
    sendSuccess(res, {
      data: { menus: result.menus },
      meta: { total: result.total, page: result.page, pages: result.pages }
    });
  } catch (err) { next(err); }
}

export async function createMenu(req, res, next) {
  try {
    const menu = await menuService.createMenu({ ...req.body, createdBy: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Menu created", data: { menu } });
  } catch (err) { next(err); }
}

export async function updateMenu(req, res, next) {
  try {
    const menu = await menuService.updateMenu(req.params.id, req.body);
    sendSuccess(res, { message: "Menu updated", data: { menu } });
  } catch (err) { next(err); }
}

export async function publishMenu(req, res, next) {
  try {
    const menu = await menuService.publishMenu(req.params.id);
    sendSuccess(res, { message: "Menu published", data: { menu } });
  } catch (err) { next(err); }
}

export async function deleteMenu(req, res, next) {
  try {
    await menuService.deleteMenu(req.params.id);
    sendSuccess(res, { message: "Menu deleted" });
  } catch (err) { next(err); }
}
export async function cleanupDuplicates(req, res, next) {
  try {
    const menuResult = await menuService.cleanupDuplicateMenus();
    const sessionResult = await menuService.dedupeSessionsInDB();
    sendSuccess(res, {
      message: `Cleaned ${menuResult.removed.length} duplicate menus, ${sessionResult.removedCount} duplicate sessions`,
      data: { menuResult, sessionResult }
    });
  } catch (err) { next(err); }
}