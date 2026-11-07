import { LeaveRequest } from "../models/LeaveRequest.js";
import { MealRegistration } from "../models/MealRegistration.js";
import { MealSession } from "../models/MealSession.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { BillingAdjustment } from "../models/BillingAdjustment.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

const DEFAULT_PRICES = { breakfast: 40, lunch: 80, snacks: 30, dinner: 90 };

async function getPricing() {
  const s = await SystemSetting.findOne({ key: "billing.perMealPrice" });
  return s && s.value ? s.value : DEFAULT_PRICES;
}

export async function apply({ userId, fromDate, toDate, affectedCategories, reason, requestType = "leave" }) {
  const overlap = await LeaveRequest.findOne({
    user: userId,
    requestType,
    status: { $in: ["pending", "approved"] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate }
  });
  if (overlap) throw new ApiError(409, "Overlapping " + requestType + " request exists");

  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;
  const prices = await getPricing();
  const cats = affectedCategories && affectedCategories.length > 0
    ? affectedCategories
    : ["breakfast", "lunch", "snacks", "dinner"];
  const dailyRate = cats.reduce((sum, c) => sum + (Number(prices[c]) || 0), 0);
  const billingImpact = days * dailyRate;

  return LeaveRequest.create({
    user: userId,
    requestType,
    fromDate,
    toDate,
    affectedCategories: cats,
    reason,
    billingImpact
  });
}

export async function listMine(userId, requestType = "leave") {
  return LeaveRequest.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

export async function cancel({ leaveId, userId }) {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) throw new ApiError(404, "Request not found");
  if (String(leave.user) !== String(userId)) throw new ApiError(403, "Not your request");
  if (leave.status !== "pending") throw new ApiError(409, "Cannot cancel " + leave.status);
  leave.status = "cancelled";
  await leave.save();
  return leave;
}

// BULLETPROOF: filter by user role, not requestType.
// Staff -> leaves, student (anyone not staff) -> refunds.
// Impossible to crossover even if requestType is corrupted.
export async function listAll(query, requestType = "leave") {
  const { page, limit, skip } = parsePagination(query);

  // Determine role filter
  const roleQuery = requestType === "leave" ? "staff" : { $ne: "staff" };

  // Get user IDs matching that role
  const matchingUsers = await User.find({ role: roleQuery }).select("_id").lean();
  const userIds = matchingUsers.map((u) => u._id);

  if (userIds.length === 0) {
    return { items: [], meta: buildMeta({ page, limit, total: 0 }) };
  }

  const filter = { user: { $in: userIds } };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate("user", "name email studentId hostel roomNumber role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LeaveRequest.countDocuments(filter)
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function decide({ leaveId, adminId, decision, remarks }) {
  const leave = await LeaveRequest.findById(leaveId);
  if (!leave) throw new ApiError(404, "Request not found");
  if (leave.status !== "pending") throw new ApiError(409, "Already " + leave.status);

  if (decision === "approve") {
    if (leave.requestType === "leave") {
      const regs = await MealRegistration.find({
        user: leave.user,
        date: { $gte: leave.fromDate, $lte: leave.toDate },
        status: "registered"
      }).populate("session", "category");

      for (const reg of regs) {
        const cat = reg.session && reg.session.category;
        if (!cat) continue;
        if (leave.affectedCategories.length === 0 || leave.affectedCategories.includes(cat)) {
          reg.status = "cancelled";
          reg.cancelledAt = new Date();
          reg.cancellationReason = "Approved leave";
          await reg.save();
          await MealSession.updateOne({ _id: reg.session._id }, { $inc: { registeredCount: -1 } });
        }
      }
    } else if (leave.requestType === "refund") {
      if (leave.billingImpact > 0) {
        await BillingAdjustment.create({
          user: leave.user,
          amount: leave.billingImpact,
          type: "credit",
          category: "refund",
          reason: "Refund approved: " + leave.reason,
          appliedToBill: false,
          createdBy: adminId
        });
      }
    }
    leave.status = "approved";
  } else {
    leave.status = "rejected";
  }

  leave.reviewedBy = adminId;
  leave.reviewedAt = new Date();
  leave.remarks = remarks || "";
  await leave.save();
  return leave;
}

// Migration: fix requestType based on user role
export async function migrateRequestTypes() {
  const records = await LeaveRequest.find().populate("user", "role").lean();
  let fixed = 0;
  let alreadyCorrect = 0;
  let skipped = 0;

  for (const r of records) {
    if (!r.user || !r.user.role) { skipped++; continue; }
    const correctType = r.user.role === "staff" ? "leave" : "refund";
    if (r.requestType === correctType) {
      alreadyCorrect++;
    } else {
      await LeaveRequest.updateOne({ _id: r._id }, { $set: { requestType: correctType } });
      fixed++;
    }
  }

  return { total: records.length, fixed, alreadyCorrect, skipped };
}

export async function debugCounts() {
  const records = await LeaveRequest.find().populate("user", "role name").lean();
  const buckets = {};
  const mismatched = [];
  const now = new Date();

  for (const r of records) {
    const role = r.user?.role || "(no user)";
    const rt = r.requestType || "(missing)";
    const status = r.status || "(no status)";
    const key = `${role}|${rt}|${status}`;
    buckets[key] = (buckets[key] || 0) + 1;

    const expectedType = role === "staff" ? "leave" : "refund";
    if (role !== "(no user)" && rt !== expectedType) {
      mismatched.push({
        id: String(r._id),
        userName: r.user?.name,
        userRole: role,
        requestType: rt,
        expected: expectedType,
        status
      });
    }
  }

  return {
    total: records.length,
    mismatched: mismatched.length,
    mismatchedRecords: mismatched,
    buckets
  };
}

// Preview what each tab WILL show (verifies the actual filter works)
export async function verifyBuckets() {
  const [staffUsers, studentUsers] = await Promise.all([
    User.find({ role: "staff" }).select("_id").lean(),
    User.find({ role: "student" }).select("_id").lean()
  ]);

  const [staffLeaves, studentRefunds] = await Promise.all([
    LeaveRequest.find({ user: { $in: staffUsers.map((u) => u._id) } })
      .populate("user", "name role")
      .lean(),
    LeaveRequest.find({ user: { $in: studentUsers.map((u) => u._id) } })
      .populate("user", "name role")
      .lean()
  ]);

  return {
    staffLeavesCount: staffLeaves.length,
    studentRefundsCount: studentRefunds.length,
    staffLeaves: staffLeaves.map((l) => ({
      id: String(l._id),
      userName: l.user?.name,
      userRole: l.user?.role,
      requestType: l.requestType,
      status: l.status
    })),
    studentRefunds: studentRefunds.map((l) => ({
      id: String(l._id),
      userName: l.user?.name,
      userRole: l.user?.role,
      requestType: l.requestType,
      status: l.status
    }))
  };
}