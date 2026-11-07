import { Feedback } from "../models/Feedback.js";
import { MealSession } from "../models/MealSession.js";
import { Attendance } from "../models/Attendance.js";
import { ApiError } from "../utils/ApiError.js";

export async function submit({ userId, data }) {
  const session = await MealSession.findById(data.sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  const attended = await Attendance.findOne({ user: userId, session: data.sessionId });
  if (!attended) throw new ApiError(403, "You did not attend this meal");
  try {
    return await Feedback.create({
      user: userId, session: data.sessionId, date: session.date,
      taste: data.taste, quality: data.quality, hygiene: data.hygiene,
      quantity: data.quantity, overall: data.overall, comment: data.comment || ""
    });
  } catch (e) {
    if (e.code === 11000) throw new ApiError(409, "Already submitted for this session");
    throw e;
  }
}
export async function mine(userId) {
  return Feedback.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean();
}
export async function listAll(query) {
  const f = {};
  if (query.sessionId) f.session = query.sessionId;
  return Feedback.find(f).sort({ createdAt: -1 }).limit(100)
    .populate("user", "name studentId")
    .populate("session", "category date").lean();
}
export async function stats(query) {
  const match = {};
  if (query.sessionId) match.session = query.sessionId;
  const agg = await Feedback.aggregate([
    { $match: match },
    { $group: {
      _id: null,
      count: { $sum: 1 },
      taste: { $avg: "$taste" }, quality: { $avg: "$quality" },
      hygiene: { $avg: "$hygiene" }, quantity: { $avg: "$quantity" },
      overall: { $avg: "$overall" }
    }}
  ]);
  return agg[0] || { count: 0, taste: 0, quality: 0, hygiene: 0, quantity: 0, overall: 0 };
}