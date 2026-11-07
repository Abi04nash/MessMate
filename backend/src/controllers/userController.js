import { sendSuccess } from "../utils/apiResponse.js";
import * as userService from "../services/userService.js";

export async function list(req, res, next) {
  try {
    const { items, meta } = await userService.list(req.query);
    sendSuccess(res, { data: { users: items }, meta });
  } catch (e) { next(e); }
}

export async function setStatus(req, res, next) {
  try {
    const user = await userService.setStatus({
      userId: req.params.id,
      status: req.body.status,
      actor: req.user
    });
    sendSuccess(res, { message: "Status updated", data: { user } });
  } catch (e) { next(e); }
}

export async function me(req, res, next) {
  try {
    const user = await userService.updateProfile({ userId: req.user._id, updates: req.body });
    sendSuccess(res, { message: "Profile updated", data: { user } });
  } catch (e) { next(e); }
}