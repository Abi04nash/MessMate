import { sendSuccess } from "../utils/apiResponse.js";
import * as leaveService from "../services/leaveService.js";

export async function createRefund(req, res, next) {
  try {
    const leave = await leaveService.apply({ userId: req.user._id, ...req.body, requestType: "refund" });
    sendSuccess(res, { statusCode: 201, message: "Refund request submitted", data: { leave } });
  } catch (err) { next(err); }
}

export async function myRefunds(req, res, next) {
  try {
    const leaves = await leaveService.listMine(req.user._id, "refund");
    sendSuccess(res, { data: { leaves } });
  } catch (err) { next(err); }
}

export async function allRefunds(req, res, next) {
  try {
    const { items, meta } = await leaveService.listAll(req.query, "refund");
    sendSuccess(res, { data: { leaves: items }, meta });
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const leave = await leaveService.apply({ userId: req.user._id, ...req.body, requestType: "leave" });
    sendSuccess(res, { statusCode: 201, message: "Leave request submitted", data: { leave } });
  } catch (err) { next(err); }
}

export async function mine(req, res, next) {
  try {
    const leaves = await leaveService.listMine(req.user._id, "leave");
    sendSuccess(res, { data: { leaves } });
  } catch (err) { next(err); }
}

export async function all(req, res, next) {
  try {
    const { items, meta } = await leaveService.listAll(req.query, "leave");
    sendSuccess(res, { data: { leaves: items }, meta });
  } catch (err) { next(err); }
}

export async function cancel(req, res, next) {
  try {
    const leave = await leaveService.cancel({ leaveId: req.params.id, userId: req.user._id });
    sendSuccess(res, { message: "Cancelled", data: { leave } });
  } catch (err) { next(err); }
}

export async function decide(req, res, next) {
  try {
    const leave = await leaveService.decide({ leaveId: req.params.id, adminId: req.user._id, ...req.body });
    sendSuccess(res, { message: "Request " + leave.status, data: { leave } });
  } catch (err) { next(err); }
}

export async function migrate(req, res, next) {
  try {
    const result = await leaveService.migrateRequestTypes();
    sendSuccess(res, { message: `Fixed ${result.fixed} of ${result.total} records`, data: result });
  } catch (err) { next(err); }
}

export async function debugCounts(req, res, next) {
  try {
    const data = await leaveService.debugCounts();
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}

export async function verify(req, res, next) {
  try {
    const data = await leaveService.verifyBuckets();
    sendSuccess(res, { data });
  } catch (err) { next(err); }
}