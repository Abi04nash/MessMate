import { MealRegistration } from "../models/MealRegistration.js";
import { MealSession } from "../models/MealSession.js";
import { SemesterEnrollment } from "../models/SemesterEnrollment.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { REGISTRATION_STATUS } from "../constants/statuses.js";

export async function registerForMeal({ userId, sessionId }) {
  const user = await User.findById(userId);
  if (user && user.messSystem === "ground_floor") {
    throw new ApiError(403, "You are on the Ground Floor semester plan. Daily registration is not required.");
  }

  const session = await MealSession.findById(sessionId);
  if (!session) throw new ApiError(404, "Meal session not found");
  if (session.registrationCutoff && new Date() > session.registrationCutoff) {
    throw new ApiError(403, "Registration is closed for this meal");
  }
  if (session.status === "completed" || session.status === "cancelled") {
    throw new ApiError(403, "Session is " + session.status);
  }

  const existing = await MealRegistration.findOne({ user: userId, session: sessionId });
  if (existing) {
    if (existing.status === REGISTRATION_STATUS.CANCELLED) {
      existing.status = REGISTRATION_STATUS.REGISTERED;
      existing.cancelledAt = undefined;
      existing.cancellationReason = "";
      await existing.save();
      await MealSession.updateOne({ _id: sessionId }, { $inc: { registeredCount: 1 } });
      return existing;
    }
    throw new ApiError(409, "You are already registered for this session");
  }

  try {
    const reg = await MealRegistration.create({
      user: userId,
      session: sessionId,
      date: session.date,
      status: REGISTRATION_STATUS.REGISTERED
    });
    await MealSession.updateOne({ _id: sessionId }, { $inc: { registeredCount: 1 } });
    return reg;
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, "Already registered");
    throw err;
  }
}

export async function cancelRegistration({ userId, registrationId }) {
  const reg = await MealRegistration.findById(registrationId);
  if (!reg) throw new ApiError(404, "Registration not found");
  if (String(reg.user) !== String(userId)) {
    throw new ApiError(403, "You can only cancel your own registration");
  }
  if (reg.status !== REGISTRATION_STATUS.REGISTERED) {
    throw new ApiError(409, "Cannot cancel a " + reg.status + " registration");
  }
  if (reg.billingExempt) {
    throw new ApiError(403, "This registration is part of your semester plan and cannot be cancelled individually.");
  }

  const session = await MealSession.findById(reg.session);
  if (session && session.cancellationCutoff && new Date() > session.cancellationCutoff) {
    throw new ApiError(403, "Cancellation window has closed.");
  }

  reg.status = REGISTRATION_STATUS.CANCELLED;
  reg.cancelledAt = new Date();
  reg.cancellationReason = "Cancelled by student";
  await reg.save();
  await MealSession.updateOne({ _id: reg.session }, { $inc: { registeredCount: -1 } });
  return reg;
}

export async function listMyRegistrations(userId) {
  return MealRegistration.find({ user: userId })
    .sort({ date: -1 })
    .limit(50)
    .populate("session")
    .lean();
}

// Returns real registrations + ground floor students enrolled for this meal
export async function listSessionRegistrations(sessionId) {
  const session = await MealSession.findById(sessionId).lean();
  if (!session) throw new ApiError(404, "Session not found");

  const realRegs = await MealRegistration.find({ session: sessionId })
    .populate("user", "name email studentId hostel roomNumber messSystem")
    .lean();

  // Filter out regs where user was deleted
  const valid = realRegs.filter((r) => r.user);

  // Ground floor students enrolled for this meal
  const dayStart = new Date(session.date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const gfEnrollments = await SemesterEnrollment.find({
    status: "active",
    meals: session.category,
    semesterStart: { $lte: dayEnd },
    semesterEnd: { $gte: dayStart }
  }).populate("user", "name email studentId hostel roomNumber messSystem").lean();

  const realUserIds = new Set(valid.map((r) => String(r.user._id)));
  const gfOnly = gfEnrollments.filter((e) => e.user && !realUserIds.has(String(e.user._id)));

  const gfEntries = gfOnly.map((e) => ({
    _id: "gf:" + String(e.user._id),
    user: e.user,
    session: sessionId,
    date: session.date,
    status: "enrolled_gf",
    isGroundFloor: true,
    enrollmentId: e._id
  }));

  return [...valid, ...gfEntries];
}