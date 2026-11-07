import { sendSuccess } from "../utils/apiResponse.js";
import * as s from "../services/wastageService.js";

export async function create(req, res, next) {
  try {
    const r = await s.create({ data: req.body, userId: req.user._id });
    sendSuccess(res, { statusCode: 201, message: "Wastage recorded", data: { record: r } });
  } catch (e) { next(e); }
}

export async function list(req, res, next) {
  try {
    const items = await s.list(req.query);
    sendSuccess(res, { data: { records: items } });
  } catch (e) { next(e); }
}

export async function mine(req, res, next) {
  try {
    const items = await s.mine(req.user._id);
    const stats = await s.myStats(req.user._id);
    sendSuccess(res, { data: { records: items, stats } });
  } catch (e) { next(e); }
}

export async function stats(req, res, next) {
  try {
    const data = await s.stats();
    sendSuccess(res, { data: { stats: data } });
  } catch (e) { next(e); }
}