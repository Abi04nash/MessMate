import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/notificationService.js";
export async function my(req, res, next) {
  try { const items = await s.my(req.user._id);
    sendSuccess(res, { data: { notifications: items } }); } catch (e) { next(e); }
}
export async function markRead(req, res, next) {
  try { await s.markRead({ userId: req.user._id, id: req.params.id });
    sendSuccess(res, { message: "Read" }); } catch (e) { next(e); }
}
export async function markAllRead(req, res, next) {
  try { await s.markAllRead(req.user._id);
    sendSuccess(res, { message: "All read" }); } catch (e) { next(e); }
}