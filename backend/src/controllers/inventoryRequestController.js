import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/inventoryRequestService.js";

export async function create(req, res, next) {
  try {
    const request = await s.create({ data: req.body, userId: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Request submitted", data: { request } });
  } catch (err) { next(err); }
}

export async function mine(req, res, next) {
  try {
    const requests = await s.mine(req.user._id);
    sendSuccess(res, { data: { requests } });
  } catch (err) { next(err); }
}

export async function all(req, res, next) {
  try {
    const { items, meta } = await s.listAll(req.query);
    sendSuccess(res, { data: { requests: items }, meta });
  } catch (err) { next(err); }
}

export async function decide(req, res, next) {
  try {
    const request = await s.decide({
      id: req.params.id,
      adminId: req.user._id,
      decision: req.body.decision,
      rejectionReason: req.body.rejectionReason,
      unitCost: req.body.unitCost
    });
    sendSuccess(res, { message: "Request " + request.status, data: { request } });
  } catch (err) { next(err); }
}