import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/settingService.js";
export async function list(req, res, next) {
  try { sendSuccess(res, { data: { settings: await s.list() } }); } catch (e) { next(e); }
}
export async function upsert(req, res, next) {
  try { const setting = await s.upsert({ key: req.params.key, value: req.body.value, category: req.body.category, description: req.body.description, userId: req.user._id });
    sendSuccess(res, { message: "Saved", data: { setting } }); } catch (e) { next(e); }
}