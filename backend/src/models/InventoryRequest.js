import mongoose from "mongoose";
import { ALL_INVENTORY_CATEGORIES, ALL_INVENTORY_UNITS } from "../constants/inventory.js";

const inventoryRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    itemName: { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      enum: ALL_INVENTORY_CATEGORIES,
      required: true
    },
    quantity: { type: Number, required: true, min: 0.1 },
    unit: { type: String, enum: ALL_INVENTORY_UNITS, required: true },
    estimatedCost: { type: Number, default: 0, min: 0 },
    note: { type: String, default: "", maxlength: 500 },
    urgency: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "fulfilled"],
      default: "pending",
      index: true
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
    linkedMovement: { type: mongoose.Schema.Types.ObjectId, ref: "StockMovement" }
  },
  { timestamps: true }
);

inventoryRequestSchema.index({ status: 1, createdAt: -1 });

export const InventoryRequest = mongoose.model("InventoryRequest", inventoryRequestSchema);