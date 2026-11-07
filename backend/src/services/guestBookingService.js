import { GuestBooking } from "../models/GuestBooking.js";
import { MealSession } from "../models/MealSession.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { ApiError } from "../utils/ApiError.js";

async function getPrice() {
  const s = await SystemSetting.findOne({ key: "billing.guestMealPrice" });
  return s ? Number(s.value) : 150;
}
export async function create({ userId, data }) {
  const session = await MealSession.findById(data.sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  const price = await getPrice();
  return GuestBooking.create({
    user: userId, session: data.sessionId, date: session.date,
    guestCount: data.guestCount, pricePerGuest: price,
    totalAmount: price * data.guestCount,
    guestNames: data.guestNames || [], notes: data.notes || ""
  });
}
export async function mine(userId) {
  return GuestBooking.find({ user: userId }).sort({ createdAt: -1 })
    .populate("session", "category date startTime").lean();
}
export async function listAll(query) {
  const f = {};
  if (query.status) f.status = query.status;
  return GuestBooking.find(f).sort({ createdAt: -1 }).limit(100)
    .populate("user", "name studentId").populate("session", "category date").lean();
}
export async function decide({ id, adminId, decision, reason }) {
  const b = await GuestBooking.findById(id);
  if (!b) throw new ApiError(404, "Not found");
  if (b.status !== "pending") throw new ApiError(409, "Already " + b.status);
  b.status = decision === "approve" ? "approved" : "rejected";
  b.approvedBy = adminId; b.approvedAt = new Date();
  if (reason) b.rejectionReason = reason;
  await b.save(); return b;
}