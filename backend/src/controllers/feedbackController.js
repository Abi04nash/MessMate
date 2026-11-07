import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/feedbackService.js";
export async function submit(req, res, next) {
  try { const fb = await s.submit({ userId: req.user._id, data: req.body });
    sendSuccess(res, { statusCode: 201, message: "Thanks for feedback", data: { feedback: fb } }); } catch (e) { next(e); }
}
export async function mine(req, res, next) {
  try { const items = await s.mine(req.user._id);
    sendSuccess(res, { data: { feedback: items } }); } catch (e) { next(e); }
}
export async function all(req, res, next) {
  try { const items = await s.listAll(req.query);
    sendSuccess(res, { data: { feedback: items } }); } catch (e) { next(e); }
}
export async function stats(req, res, next) {
  try { const stats = await s.stats(req.query);
    sendSuccess(res, { data: { stats } }); } catch (e) { next(e); }
}