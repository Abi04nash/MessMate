import { sendSuccess } from "../utils/apiResponse.js";
import * as complaintService from "../services/complaintService.js";

export async function create(req, res, next) {
  try {
    const complaint = await complaintService.createComplaint({ userId: req.user._id, data: req.body });
    sendSuccess(res, { statusCode: 201, message: "Complaint submitted", data: { complaint } });
  } catch (err) { next(err); }
}

export async function mine(req, res, next) {
  try {
    const complaints = await complaintService.listMine(req.user._id);
    sendSuccess(res, { data: { complaints } });
  } catch (err) { next(err); }
}

export async function all(req, res, next) {
  try {
    const { items, meta } = await complaintService.listAll(req.query);
    sendSuccess(res, { data: { complaints: items }, meta });
  } catch (err) { next(err); }
}

export async function detail(req, res, next) {
  try {
    const complaint = await complaintService.getDetail(req.params.id, {
      userId: req.user._id,
      role: req.user.role
    });
    sendSuccess(res, { data: { complaint } });
  } catch (err) { next(err); }
}

export async function addMessage(req, res, next) {
  try {
    const message = await complaintService.addMessage({
      complaintId: req.params.id,
      authorId: req.user._id,
      role: req.user.role,
      message: req.body.message,
      isInternal: req.body.isInternal
    });
    sendSuccess(res, { statusCode: 201, message: "Message added", data: { message } });
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const complaint = await complaintService.updateStatus({
      complaintId: req.params.id,
      adminId: req.user._id,
      ...req.body
    });
    sendSuccess(res, { message: "Status updated", data: { complaint } });
  } catch (err) { next(err); }
}

export async function rate(req, res, next) {
  try {
    const complaint = await complaintService.rate({
      complaintId: req.params.id,
      userId: req.user._id,
      ...req.body
    });
    sendSuccess(res, { message: "Complaint rated", data: { complaint } });
  } catch (err) { next(err); }
}