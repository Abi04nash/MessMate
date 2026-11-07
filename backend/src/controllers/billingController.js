import { sendSuccess } from "../utils/apiResponse.js";
import * as billingService from "../services/billingService.js";

export async function generate(req, res, next) {
  try {
    const bill = await billingService.generateBill({ ...req.body, createdBy: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Bill generated", data: { bill } });
  } catch (err) { next(err); }
}
export async function running(req, res, next) {
  try {
    const bill = await billingService.getRunningBill(req.user._id);
    sendSuccess(res, { data: { bill } });
  } catch (err) { next(err); }
}
export async function debug(req, res, next) {
  try {
    const data = await billingService.getDebugInfo(req.user._id);
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}
export async function reset(req, res, next) {
  try {
    const deleted = await billingService.resetPayments(req.user._id);
    sendSuccess(res, { message: `Deleted ${deleted} payment records` });
  } catch (err) { next(err); }
}
export async function my(req, res, next) {
  try {
    const bills = await billingService.listMyBills(req.user._id);
    sendSuccess(res, { data: { bills } });
  } catch (err) { next(err); }
}
export async function all(req, res, next) {
  try {
    const { items, meta } = await billingService.listAllBills(req.query);
    sendSuccess(res, { data: { bills: items }, meta });
  } catch (err) { next(err); }
}
export async function detail(req, res, next) {
  try {
    const bill = await billingService.getBillDetail(req.params.id, { userId: req.user._id, role: req.user.role });
    sendSuccess(res, { data: { bill } });
  } catch (err) { next(err); }
}
export async function adjust(req, res, next) {
  try {
    const adjustment = await billingService.applyAdjustment({ ...req.body, createdBy: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Adjustment applied", data: { adjustment } });
  } catch (err) { next(err); }
}