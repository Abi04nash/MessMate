import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/pollService.js";
export async function create(req, res, next) {
  try { const p = await s.create({ data: req.body, userId: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Poll created", data: { poll: p } }); } catch (e) { next(e); }
}
export async function active(req, res, next) {
  try { sendSuccess(res, { data: { polls: await s.active() } }); } catch (e) { next(e); }
}
export async function vote(req, res, next) {
  try { const v = await s.vote({ userId: req.user._id, pollId: req.params.id, optionId: req.body.optionId });
    sendSuccess(res, { message: "Voted", data: { vote: v } }); } catch (e) { next(e); }
}
export async function results(req, res, next) {
  try { sendSuccess(res, { data: await s.results(req.params.id) }); } catch (e) { next(e); }
}