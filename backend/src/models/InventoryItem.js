import mongoose from "mongoose";
import { ALL_INVENTORY_CATEGORIES, ALL_INVENTORY_UNITS } from "../constants/inventory.js";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ALL_INVENTORY_CATEGORIES,
      required: true,
      index: true
    },
    unit: { type: String, enum: ALL_INVENTORY_UNITS, required: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    criticalStockLevel: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    lastPurchaseDate: { type: Date },
    expiryDate: { type: Date },
    active: { type: Boolean, default: true, index: true },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

inventoryItemSchema.index({ name: 1, category: 1 }, { unique: true });
inventoryItemSchema.index({ category: 1, quantity: 1 });

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);