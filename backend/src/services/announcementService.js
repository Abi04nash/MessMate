import { Announcement } from "../models/Announcement.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { getIO } from "../sockets/index.js";

export async function create({ data, userId }) {
  const a = await Announcement.create({
    title: data.title, body: data.body, category: data.category || "general",
    priority: data.priority || "normal", targetRoles: data.targetRoles || [],
    published: data.published !== false, publishedAt: new Date(), publishedBy: userId
  });
  if (a.published) await fanout(a);
  return a;
}
async function fanout(a) {
  const roleFilter = a.targetRoles?.length ? { role: { $in: a.targetRoles } } : {};
  const users = await User.find({ status: "active", ...roleFilter }).select("_id").lean();
  if (users.length === 0) return;
  const notifications = users.map((u) => ({
    user: u._id, type: "announcement", title: a.title, message: a.body.slice(0, 200),
    link: "/", meta: { announcementId: String(a._id) }
  }));
  await Notification.insertMany(notifications);
  try { const io = getIO(); if (io) io.emit("notification:new", { title: a.title, message: a.body.slice(0, 200) }); } catch {}
}
export async function list({ role, query }) {
  const filter = {};
  if (role === "student") filter.published = true;
  if (query.category) filter.category = query.category;
  return Announcement.find(filter).sort({ createdAt: -1 }).limit(50)
    .populate("publishedBy", "name role").lean();
}
export async function publish({ id, userId }) {
  const a = await Announcement.findById(id);
  if (!a) throw new ApiError(404, "Not found");
  a.published = true; a.publishedAt = new Date(); a.publishedBy = userId;
  await a.save(); await fanout(a); return a;
}