import { Attendance } from "../models/Attendance.js";
import { MealRegistration } from "../models/MealRegistration.js";
import { MealSession } from "../models/MealSession.js";
import { User } from "../models/User.js";
import { SystemSetting } from "../models/SystemSetting.js";
import { ApiError } from "../utils/ApiError.js";
import { signQrPass, verifyQrPass } from "../utils/qrPass.js";
import { REGISTRATION_STATUS } from "../constants/statuses.js";

export async function generateQrPass({ userId, sessionId }) {
  const session = await MealSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  const reg = await MealRegistration.findOne({
    user: userId, session: sessionId, status: REGISTRATION_STATUS.REGISTERED
  });
  if (!reg) throw new ApiError(403, "No active registration for this session");
  const ttlSetting = await SystemSetting.findOne({ key: "attendance.qrTtlMinutes" });
  const ttl = ttlSetting ? Number(ttlSetting.value) : 10;
  const token = signQrPass({ userId, sessionId, registrationId: reg._id, ttlMinutes: ttl });
  return { token, expiresInMinutes: ttl };
}

export async function verifyQrAndCheckIn({ qrToken, staffId }) {
  let payload;
  try { payload = verifyQrPass(qrToken); }
  catch { throw new ApiError(400, "Invalid or expired QR pass"); }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(404, "Student not found");
  const session = await MealSession.findById(payload.sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  const reg = await MealRegistration.findById(payload.registrationId);
  if (!reg) throw new ApiError(404, "Registration not found");
  if (reg.status !== REGISTRATION_STATUS.REGISTERED) throw new ApiError(409, "Registration is " + reg.status);

  try {
    const attendance = await Attendance.create({
      user: payload.sub, session: payload.sessionId, registration: payload.registrationId,
      date: session.date, attendedAt: new Date(), method: "qr",
      verifiedBy: staffId, nonce: payload.nonce
    });
    await MealRegistration.updateOne({ _id: payload.registrationId }, { status: REGISTRATION_STATUS.ATTENDED });
    await MealSession.updateOne({ _id: payload.sessionId }, { $inc: { attendedCount: 1 } });
    return attendance;
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "Attendance already recorded");
    throw err;
  }
}

// Handles both 1st floor (real registrationId) and ground floor ("gf:<userId>") check-ins
export async function manualCheckIn({ registrationId, sessionId, staffId }) {
  // Ground floor path - registrationId is "gf:<userId>"
  if (String(registrationId).startsWith("gf:")) {
    const userId = String(registrationId).slice(3);
    const session = await MealSession.findById(sessionId);
    if (!session) throw new ApiError(404, "Session not found");

    const existing = await Attendance.findOne({ user: userId, session: sessionId });
    if (existing) throw new ApiError(409, "Already marked present");

    // Find or create a billingExempt registration
    let reg = await MealRegistration.findOne({ user: userId, session: sessionId });
    if (!reg) {
      try {
        reg = await MealRegistration.create({
          user: userId,
          session: sessionId,
          date: session.date,
          status: REGISTRATION_STATUS.ATTENDED,
          billingExempt: true
        });
        await MealSession.updateOne({ _id: sessionId }, { $inc: { registeredCount: 1 } });
      } catch (e) {
        if (e.code === 11000) {
          reg = await MealRegistration.findOne({ user: userId, session: sessionId });
        } else throw e;
      }
    } else {
      reg.status = REGISTRATION_STATUS.ATTENDED;
      await reg.save();
    }

    const attendance = await Attendance.create({
      user: userId,
      session: sessionId,
      registration: reg._id,
      date: session.date,
      attendedAt: new Date(),
      method: "manual",
      verifiedBy: staffId
    });
    await MealSession.updateOne({ _id: sessionId }, { $inc: { attendedCount: 1 } });
    return attendance;
  }

  // 1st floor path
  const reg = await MealRegistration.findById(registrationId);
  if (!reg) throw new ApiError(404, "Registration not found");
  if (reg.status !== REGISTRATION_STATUS.REGISTERED) {
    throw new ApiError(409, "Registration is " + reg.status);
  }
  const session = await MealSession.findById(reg.session);
  if (!session) throw new ApiError(404, "Session not found");

  try {
    const attendance = await Attendance.create({
      user: reg.user, session: reg.session, registration: reg._id,
      date: session.date, attendedAt: new Date(), method: "manual",
      verifiedBy: staffId, nonce: ""
    });
    await MealRegistration.updateOne({ _id: reg._id }, { status: REGISTRATION_STATUS.ATTENDED });
    await MealSession.updateOne({ _id: reg.session }, { $inc: { attendedCount: 1 } });
    return attendance;
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "Attendance already recorded for this student");
    throw err;
  }
}

export async function getMyAttendance(userId) {
  return Attendance.find({ user: userId })
    .sort({ attendedAt: -1 })
    .limit(100)
    .populate("session")
    .lean();
}

export async function getSessionAttendance(sessionId) {
  return Attendance.find({ session: sessionId })
    .populate("user", "name studentId hostel roomNumber")
    .lean();
}