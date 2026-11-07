import { Complaint } from "../models/Complaint.js";
import { ComplaintMessage } from "../models/ComplaintMessage.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export async function createComplaint({ userId, data }) {
  const complaint = await Complaint.create({
    user: userId,
    category: data.category,
    title: data.title,
    description: data.description,
    priority: data.priority,
    images: data.images
  });
  return complaint;
}

export async function listMine(userId) {
  return Complaint.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
}

export async function listAll(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  const [items, total] = await Promise.all([
    Complaint.find(filter)
      .populate("user", "name email studentId")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Complaint.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getDetail(complaintId, { userId, role }) {
  const c = await Complaint.findById(complaintId)
    .populate("user", "name email studentId")
    .populate("assignedTo", "name email")
    .populate("resolvedBy", "name email")
    .lean();
  if (!c) throw new ApiError(404, "Complaint not found");
  if (role === "student" && String(c.user._id) !== String(userId)) {
    throw new ApiError(403, "Not your complaint");
  }

  const messages = await ComplaintMessage.find({ complaint: complaintId })
    .populate("author", "name role")
    .sort({ createdAt: 1 })
    .lean();

  const visible = role === "student" ? messages.filter((m) => !m.isInternal) : messages;
  return { ...c, messages: visible };
}

export async function addMessage({ complaintId, authorId, role, message, isInternal }) {
  const c = await Complaint.findById(complaintId);
  if (!c) throw new ApiError(404, "Complaint not found");
  if (role === "student" && String(c.user) !== String(authorId)) {
    throw new ApiError(403, "Not your complaint");
  }
  const internal = role === "student" ? false : !!isInternal;

  const msg = await ComplaintMessage.create({
    complaint: complaintId,
    author: authorId,
    message,
    isInternal: internal
  });
  return msg;
}

export async function updateStatus({ complaintId, status, assignedTo, resolutionNote, adminId }) {
  const c = await Complaint.findById(complaintId);
  if (!c) throw new ApiError(404, "Complaint not found");

  c.status = status;
  if (assignedTo) c.assignedTo = assignedTo;
  if (status === "resolved") {
    c.resolvedAt = new Date();
    c.resolvedBy = adminId;
    if (resolutionNote) c.resolutionNote = resolutionNote;
  }
  await c.save();
  return c;
}

export async function rate({ complaintId, userId, rating, ratingComment }) {
  const c = await Complaint.findById(complaintId);
  if (!c) throw new ApiError(404, "Complaint not found");
  if (String(c.user) !== String(userId)) throw new ApiError(403, "Not your complaint");
  if (c.status !== "resolved") throw new ApiError(409, "Can only rate resolved complaints");
  if (c.rating) throw new ApiError(409, "Already rated");

  c.rating = rating;
  c.ratingComment = ratingComment || "";
  await c.save();
  return c;
}