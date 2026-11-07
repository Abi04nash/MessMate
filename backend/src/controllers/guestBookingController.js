import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/guestBookingService.js";
export async function create(req, res, next) {
  try { const b = await s.create({ userId: req.user._id, data: req.body });
    sendSuccess(res, { statusCode: 201, message: "Booked", data: { booking: b } }); } catch (e) { next(e); }
}
export async function mine(req, res, next) {
  try { const items = await s.mine(req.user._id);
    sendSuccess(res, { data: { bookings: items } }); } catch (e) { next(e); }
}
export async function all(req, res, next) {
  try { const items = await s.listAll(req.query);
    sendSuccess(res, { data: { bookings: items } }); } catch (e) { next(e); }
}
export async function decide(req, res, next) {
  try { const b = await s.decide({ id: req.params.id, adminId: req.user._id, ...req.body });
    sendSuccess(res, { message: "Decision saved", data: { booking: b } }); } catch (e) { next(e); }
}