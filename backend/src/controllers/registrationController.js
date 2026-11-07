import { sendSuccess } from "../utils/apiResponse.js";
import * as registrationService from "../services/registrationService.js";

export async function create(req, res, next) {
  try {
    const reg = await registrationService.registerForMeal({
      userId: req.user._id,
      sessionId: req.body.sessionId
    });
    sendSuccess(res, { statusCode: 201, message: "Registered for meal", data: { registration: reg } });
  } catch (err) { next(err); }
}

export async function cancel(req, res, next) {
  try {
    const reg = await registrationService.cancelRegistration({
      userId: req.user._id,
      registrationId: req.params.id
    });
    sendSuccess(res, { message: "Registration cancelled", data: { registration: reg } });
  } catch (err) { next(err); }
}

export async function my(req, res, next) {
  try {
    const registrations = await registrationService.listMyRegistrations(req.user._id);
    sendSuccess(res, { data: { registrations } });
  } catch (err) { next(err); }
}

export async function bySession(req, res, next) {
  try {
    const registrations = await registrationService.listSessionRegistrations(req.params.sessionId);
    sendSuccess(res, { data: { registrations } });
  } catch (err) { next(err); }
}