import mongoose from "mongoose";
import { ALL_STOCK_MOVEMENT_TYPES, ALL_INVENTORY_UNITS } from "../constants/inventory.js";

const stockMovementSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ALL_STOCK_MOVEMENT_TYPES,
      required: true,
      index: true
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ALL_INVENTORY_UNITS, required: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "", maxlength: 500 },
    reference: { type: String, default: "" },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

stockMovementSchema.index({ inventoryItem: 1, createdAt: -1 });

export const StockMovement = mongoose.model("StockMovement", stockMovementSchema);