import { MealRegistration } from "../models/MealRegistration.js";
import { MealSession } from "../models/MealSession.js";
import { ApiError } from "../utils/ApiError.js";
import { REGISTRATION_STATUS } from "../constants/statuses.js";

export async function registerForMeal({ userId, sessionId }) {
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
      // Allow re-registration after cancel
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

  const session = await MealSession.findById(reg.session);
  if (session && session.cancellationCutoff && new Date() > session.cancellationCutoff) {
    throw new ApiError(403, "Cancellation window has closed. This meal will be billed.");
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

export async function listSessionRegistrations(sessionId) {
  return MealRegistration.find({ session: sessionId })
    .populate("user", "name email studentId hostel roomNumber")
    .lean();
}