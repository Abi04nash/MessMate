import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";

export async function my(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(30).lean();
}
export async function markRead({ userId, id }) {
  const n = await Notification.findById(id);
  if (!n) throw new ApiError(404, "Not found");
  if (String(n.user) !== String(userId)) throw new ApiError(403, "Not yours");
  n.readAt = new Date(); await n.save(); return n;
}
export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, readAt: null }, { readAt: new Date() });
}