import { InventoryItem } from "../models/InventoryItem.js";
import { StockMovement } from "../models/StockMovement.js";
import { ApiError } from "../utils/ApiError.js";

export async function create({ data, userId }) {
  const item = await InventoryItem.create({
    name: data.name, category: data.category, unit: data.unit,
    quantity: data.quantity || 0, minStockLevel: data.minStockLevel || 0,
    criticalStockLevel: data.criticalStockLevel || 0, unitCost: data.unitCost || 0,
    supplier: data.supplier, expiryDate: data.expiryDate, notes: data.notes || ""
  });
  if (item.quantity > 0) {
    await StockMovement.create({
      inventoryItem: item._id, type: "adjustment", quantity: item.quantity,
      unit: item.unit, unitCost: item.unitCost, totalCost: item.quantity * item.unitCost,
      balanceAfter: item.quantity, reason: "Initial stock", performedBy: userId
    });
  }
  return item;
}
export async function list(query) {
  const f = {};
  if (query.category) f.category = query.category;
  if (query.lowStock === "true") f.$expr = { $lte: ["$quantity", "$minStockLevel"] };
  return InventoryItem.find(f).sort({ name: 1 }).limit(200).populate("supplier", "name").lean();
}
export async function recordMovement({ id, data, userId }) {
  const item = await InventoryItem.findById(id);
  if (!item) throw new ApiError(404, "Item not found");
  const delta = data.type === "purchase" || data.type === "return" ? data.quantity : -data.quantity;
  const newQty = item.quantity + delta;
  if (newQty < 0) throw new ApiError(400, "Insufficient stock. Available: " + item.quantity);
  item.quantity = newQty;
  if (data.type === "purchase") item.lastPurchaseDate = new Date();
  await item.save();
  return StockMovement.create({
    inventoryItem: item._id, type: data.type, quantity: data.quantity,
    unit: item.unit, unitCost: data.unitCost || item.unitCost,
    totalCost: data.quantity * (data.unitCost || item.unitCost),
    balanceAfter: newQty, reason: data.reason || "",
    performedBy: userId
  });
}
export async function movements({ id }) {
  return StockMovement.find({ inventoryItem: id }).sort({ createdAt: -1 }).limit(50).lean();
}