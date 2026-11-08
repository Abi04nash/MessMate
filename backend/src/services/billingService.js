import { Bill } from "../models/Bill.js";
import { Payment } from "../models/Payment.js";
import { MealRegistration } from "../models/MealRegistration.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { BillingAdjustment } from "../models/BillingAdjustment.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

const DEFAULT_PRICES = { breakfast: 40, lunch: 80, snacks: 30, dinner: 90 };
const BILLABLE_STATUSES = ["registered", "attended"];

async function getPricing() {
  const s = await SystemSetting.findOne({ key: "billing.perMealPrice" });
  return s && s.value ? s.value : DEFAULT_PRICES;
}

function buildItemsFromCounts(counts, prices) {
  const items = [];
  let subtotal = 0;
  for (const cat of ["breakfast", "lunch", "snacks", "dinner"]) {
    if (counts[cat] > 0) {
      const unitPrice = Number(prices[cat]) || 0;
      const amount = counts[cat] * unitPrice;
      items.push({
        label: cat.charAt(0).toUpperCase() + cat.slice(1) + " meals",
        quantity: counts[cat],
        unitPrice,
        amount
      });
      subtotal += amount;
    }
  }
  return { items, subtotal };
}

async function aggregateUserMeals({ userId, from, to }) {
  const regs = await MealRegistration.find({
    user: userId,
    date: { $gte: from, $lt: to },
    status: { $in: BILLABLE_STATUSES },
    billingExempt: { $ne: true }
  }).populate("session", "category").lean();

  const counts = { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 };
  for (const r of regs) {
    const cat = r.session && r.session.category;
    if (cat && cat in counts) counts[cat] += 1;
  }
  return counts;
}

export async function getRunningBill(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [counts, prices, paymentAgg, adjAgg] = await Promise.all([
    aggregateUserMeals({ userId, from: monthStart, to: nextMonth }),
    getPricing(),
    Payment.aggregate([
      { $match: { user: userId, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    BillingAdjustment.aggregate([
      { $match: { user: userId, createdAt: { $gte: monthStart, $lt: nextMonth } } },
      { $group: {
          _id: null,
          credits: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] } },
          debits: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] } }
      }}
    ])
  ]);

  const { items, subtotal } = buildItemsFromCounts(counts, prices);
  const totalPaid = paymentAgg[0]?.total || 0;
  const adj = adjAgg[0] || { credits: 0, debits: 0 };
  const total = Math.max(0, subtotal + adj.debits - adj.credits);
  const outstanding = Math.max(0, total - totalPaid);

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    items,
    subtotal,
    adjustments: { credits: adj.credits, debits: adj.debits },
    total,
    totalPaid,
    outstanding,
    counts,
    asOf: new Date()
  };
}

export async function getDebugInfo(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [registrations, payments, runningBill, allPayments] = await Promise.all([
    MealRegistration.find({ user: userId }).sort({ date: -1 }).limit(20).populate("session", "category date").lean(),
    Payment.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean(),
    getRunningBill(userId),
    Payment.countDocuments({ user: userId })
  ]);

  return {
    userId: String(userId),
    now,
    monthStart,
    nextMonth,
    runningBill,
    totalPaymentCount: allPayments,
    recentRegistrations: registrations.map((r) => ({
      _id: String(r._id),
      status: r.status,
      date: r.date,
      sessionDate: r.session?.date || null,
      sessionCategory: r.session?.category || null
    })),
    recentPayments: payments.map((p) => ({
      _id: String(p._id),
      amount: p.amount,
      method: p.method,
      status: p.status,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      providerRef: p.providerRef
    }))
  };
}

export async function resetPayments(userId) {
  const result = await Payment.deleteMany({ user: userId });
  return result.deletedCount;
}

export async function generateBill({ userId, month, year, createdBy }) {
  const existing = await Bill.findOne({ user: userId, month, year });
  if (existing) throw new ApiError(409, "Bill already exists");
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const [counts, prices] = await Promise.all([
    aggregateUserMeals({ userId, from, to }),
    getPricing()
  ]);
  const { items, subtotal } = buildItemsFromCounts(counts, prices);
  return Bill.create({
    user: userId, month, year, items, subtotal, total: subtotal,
    outstanding: subtotal, status: items.length > 0 ? "issued" : "draft",
    issuedAt: items.length > 0 ? new Date() : undefined,
    dueDate: new Date(year, month - 1, 15),
    snapshot: { prices, generatedAt: new Date() }, createdBy
  });
}

export async function listMyBills(userId) {
  return Bill.find({ user: userId }).sort({ year: -1, month: -1 }).lean();
}

export async function getBillDetail(billId, { userId, role }) {
  const bill = await Bill.findById(billId).populate("user", "name email studentId").lean();
  if (!bill) throw new ApiError(404, "Bill not found");
  if (role === "student" && String(bill.user._id) !== String(userId)) {
    throw new ApiError(403, "Not your bill");
  }
  return bill;
}

export async function listAllBills(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.month) filter.month = Number(query.month);
  if (query.year) filter.year = Number(query.year);
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Bill.find(filter).populate("user", "name email studentId").sort({ year: -1, month: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function applyAdjustment({ userId, billId, amount, type, category, reason, createdBy }) {
  let bill = null;
  if (billId) {
    bill = await Bill.findById(billId);
    if (!bill) throw new ApiError(404, "Bill not found");
    if (String(bill.user) !== String(userId)) throw new ApiError(400, "Bill does not belong to user");
  }
  const adjustment = await BillingAdjustment.create({
    user: userId, bill: billId, amount, type,
    category: category || "other", reason,
    appliedToBill: !!bill, createdBy
  });
  if (bill) {
    const delta = type === "credit" ? -amount : amount;
    bill.adjustmentsTotal = (bill.adjustmentsTotal || 0) + delta;
    bill.total = Math.max(0, bill.subtotal + bill.adjustmentsTotal);
    bill.outstanding = Math.max(0, bill.total - (bill.amountPaid || 0));
    if (bill.outstanding === 0 && bill.amountPaid > 0) bill.status = "paid";
    else if (bill.amountPaid > 0) bill.status = "partially_paid";
    await bill.save();
  }
  return adjustment;
}