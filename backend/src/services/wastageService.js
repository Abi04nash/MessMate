import { WastageRecord } from "../models/WastageRecord.js";
import { MealSession } from "../models/MealSession.js";
import { ApiError } from "../utils/ApiError.js";

export async function create({ data, userId }) {
  if (!data.itemName || !String(data.itemName).trim()) {
    throw new ApiError(400, "Item name is required");
  }
  if (!data.quantity || Number(data.quantity) <= 0) {
    throw new ApiError(400, "Quantity must be greater than 0");
  }
  if (!data.unit) {
    throw new ApiError(400, "Unit is required");
  }

  let sessionId = undefined;
  if (data.sessionId) {
    const session = await MealSession.findById(data.sessionId);
    if (!session) throw new ApiError(404, "Meal session not found");
    sessionId = session._id;
  }

  return WastageRecord.create({
    session: sessionId,
    date: data.date ? new Date(data.date) : new Date(),
    itemName: String(data.itemName).trim(),
    quantity: Number(data.quantity),
    unit: data.unit,
    reason: data.reason || "leftover",
    estimatedCost: Number(data.estimatedCost) || 0,
    notes: data.notes || "",
    recordedBy: userId
  });
}

export async function list(query) {
  const filter = {};
  if (query.reason) filter.reason = query.reason;
  return WastageRecord.find(filter)
    .sort({ date: -1 })
    .limit(100)
    .populate("session", "category")
    .populate("recordedBy", "name")
    .lean();
}

export async function mine(userId) {
  return WastageRecord.find({ recordedBy: userId })
    .sort({ date: -1 })
    .limit(100)
    .populate("session", "category")
    .lean();
}

export async function myStats(userId) {
  const agg = await WastageRecord.aggregate([
    { $match: { recordedBy: userId } },
    { $group: {
        _id: null,
        count: { $sum: 1 },
        totalCost: { $sum: "$estimatedCost" }
    }}
  ]);
  return agg[0] || { count: 0, totalCost: 0 };
}

export async function stats() {
  const agg = await WastageRecord.aggregate([
    { $group: {
        _id: "$reason",
        count: { $sum: 1 },
        totalQty: { $sum: "$quantity" },
        totalCost: { $sum: "$estimatedCost" }
    }},
    { $sort: { count: -1 } }
  ]);
  return agg;
}