import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/announcementService.js";
export async function create(req, res, next) {
  try { const a = await s.create({ data: req.body, userId: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Published", data: { announcement: a } }); } catch (e) { next(e); }
}
export async function list(req, res, next) {
  try { const items = await s.list({ role: req.user.role, query: req.query });
    sendSuccess(res, { data: { announcements: items } }); } catch (e) { next(e); }
}
export async function publish(req, res, next) {
  try { const a = await s.publish({ id: req.params.id, userId: req.user._id });
    sendSuccess(res, { message: "Published", data: { announcement: a } }); } catch (e) { next(e); }
}