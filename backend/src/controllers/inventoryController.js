import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/inventoryService.js";
export async function create(req, res, next) {
  try { const item = await s.create({ data: req.body, userId: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Created", data: { item } }); } catch (e) { next(e); }
}
export async function list(req, res, next) {
  try { const items = await s.list(req.query);
    sendSuccess(res, { data: { items } }); } catch (e) { next(e); }
}
export async function stock(req, res, next) {
  try { const m = await s.recordMovement({ id: req.params.id, data: req.body, userId: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Stock updated", data: { movement: m } }); } catch (e) { next(e); }
}
export async function movements(req, res, next) {
  try { const items = await s.movements({ id: req.params.id });
    sendSuccess(res, { data: { movements: items } }); } catch (e) { next(e); }
}