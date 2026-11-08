import { sendSuccess } from "../utils/apiResponse.js";
import * as svc from "../services/groundFloorService.js";

export async function info(req, res, next) {
  try { sendSuccess(res, { data: await svc.getInfo(req.user._id) }); }
  catch (e) { next(e); }
}

export async function enroll(req, res, next) {
  try {
    const result = await svc.enroll({
      userId: req.user._id,
      meals: req.body.meals,
      method: req.body.method || "upi"
    });
    sendSuccess(res, { statusCode: 201, message: "Enrolled successfully", data: result });
  } catch (e) { next(e); }
}

export async function my(req, res, next) {
  try { sendSuccess(res, { data: { enrollment: await svc.myEnrollment(req.user._id) } }); }
  catch (e) { next(e); }
}