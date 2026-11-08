import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export async function list(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.hostel) filter.hostel = query.hostel;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { studentId: { $regex: query.search, $options: "i" } }
    ];
  }
  const [items, total] = await Promise.all([
    User.find(filter).select("-passwordHash").populate("hostel", "name code")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function setStatus({ userId, status, actor }) {
  if (!["active", "suspended"].includes(status)) {
    throw new ApiError(400, "Status must be 'active' or 'suspended'");
  }
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Warden accounts are protected from suspension by anyone
  if (user.role === "admin") {
    throw new ApiError(403, "Warden accounts cannot be suspended");
  }

  // Admin cannot suspend themselves
  if (actor && String(actor._id) === String(userId)) {
    throw new ApiError(403, "You cannot change your own status");
  }

  user.status = status;
  await user.save();
  return user.toSafeJSON();
}

export async function updateProfile({ userId, updates }) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  const allowed = ["name", "phone", "roomNumber", "semester", "hostel", "profileImageUrl", "messSystem"];
  for (const k of allowed) if (updates[k] !== undefined) user[k] = updates[k];
  await user.save();
  return user.toSafeJSON();
}