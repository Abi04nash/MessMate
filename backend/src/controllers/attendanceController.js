import { sendSuccess } from "../utils/apiResponse.js";
import * as attendanceService from "../services/attendanceService.js";

export async function generateQr(req, res, next) {
  try {
    const qrPass = await attendanceService.generateQrPass({
      userId: req.user._id,
      sessionId: req.body.sessionId
    });
    sendSuccess(res, { message: "QR pass generated", data: { qrPass } });
  } catch (err) { next(err); }
}

export async function verifyQr(req, res, next) {
  try {
    const attendance = await attendanceService.verifyQrAndCheckIn({
      qrToken: req.body.qrToken,
      staffId: req.user._id
    });
    sendSuccess(res, { message: "Attendance recorded", data: { attendance } });
  } catch (err) { next(err); }
}

export async function manual(req, res, next) {
  try {
    const attendance = await attendanceService.manualCheckIn({
      registrationId: req.body.registrationId,
      sessionId: req.body.sessionId,
      staffId: req.user._id
    });
    sendSuccess(res, { message: "Attendance recorded", data: { attendance } });
  } catch (err) { next(err); }
}

export async function my(req, res, next) {
  try {
    const attendance = await attendanceService.getMyAttendance(req.user._id);
    sendSuccess(res, { data: { attendance } });
  } catch (err) { next(err); }
}

export async function bySession(req, res, next) {
  try {
    const attendance = await attendanceService.getSessionAttendance(req.params.sessionId);
    sendSuccess(res, { data: { attendance } });
  } catch (err) { next(err); }
}