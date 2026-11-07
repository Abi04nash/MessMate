import { SystemSetting } from "../models/SystemSetting.js";
import { ApiError } from "../utils/ApiError.js";
export async function list() { return SystemSetting.find({}).sort({ key: 1 }).lean(); }
export async function upsert({ key, value, category, description, userId }) {
  const existing = await SystemSetting.findOne({ key });
  if (existing) {
    existing.value = value;
    if (description !== undefined) existing.description = description;
    if (category) existing.category = category;
    existing.updatedBy = userId;
    await existing.save(); return existing;
  }
  return SystemSetting.create({ key, value, category: category || "general", description: description || "", updatedBy: userId });
}
export async function get(key) {
  const s = await SystemSetting.findOne({ key });
  if (!s) throw new ApiError(404, "Setting not found");
  return s;
}