import { InventoryRequest } from "../models/InventoryRequest.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { StockMovement } from "../models/StockMovement.js";
import { ApiError } from "../utils/ApiError.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export async function create({ data, userId }) {
  return InventoryRequest.create({
    requestedBy: userId,
    itemName: data.itemName,
    category: data.category,
    quantity: data.quantity,
    unit: data.unit,
    estimatedCost: data.estimatedCost || 0,
    note: data.note || "",
    urgency: data.urgency || "normal"
  });
}

export async function mine(userId) {
  return InventoryRequest.find({ requestedBy: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

export async function listAll(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    InventoryRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("requestedBy", "name email role")
      .populate("approvedBy", "name email role")
      .lean(),
    InventoryRequest.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function decide({ id, adminId, decision, rejectionReason, unitCost }) {
  const req = await InventoryRequest.findById(id);
  if (!req) throw new ApiError(404, "Request not found");
  if (req.status !== "pending") throw new ApiError(409, "Request is already " + req.status);

  if (decision === "reject") {
    req.status = "rejected";
    req.rejectionReason = rejectionReason || "";
    req.approvedBy = adminId;
    req.approvedAt = new Date();
    await req.save();
    return req;
  }

  let item = await InventoryItem.findOne({
    name: { $regex: "^" + req.itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" },
    category: req.category
  });

  if (!item) {
    item = await InventoryItem.create({
      name: req.itemName,
      category: req.category,
      unit: req.unit,
      quantity: 0,
      minStockLevel: 0,
      criticalStockLevel: 0,
      unitCost: unitCost || (req.quantity > 0 ? req.estimatedCost / req.quantity : 0)
    });
  }

  const effectiveCost = unitCost || item.unitCost || (req.quantity > 0 ? req.estimatedCost / req.quantity : 0);
  item.quantity += req.quantity;
  item.lastPurchaseDate = new Date();
  if (effectiveCost > 0) item.unitCost = effectiveCost;
  await item.save();

  const movement = await StockMovement.create({
    inventoryItem: item._id,
    type: "purchase",
    quantity: req.quantity,
    unit: req.unit,
    unitCost: effectiveCost,
    totalCost: req.quantity * effectiveCost,
    balanceAfter: item.quantity,
    reason: "Request approved: " + (req.note || "Staff request"),
    performedBy: adminId,
    meta: { requestId: String(req._id), requestedBy: String(req.requestedBy) }
  });

  req.status = "fulfilled";
  req.approvedBy = adminId;
  req.approvedAt = new Date();
  req.linkedMovement = movement._id;
  await req.save();
  return req;
}