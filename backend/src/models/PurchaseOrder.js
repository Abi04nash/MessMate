import mongoose from "mongoose";
import { ALL_PURCHASE_ORDER_STATUS } from "../constants/inventory.js";

const poItemSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true
    },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true
    },
    items: { type: [poItemSchema], default: [] },
    totalAmount: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ALL_PURCHASE_ORDER_STATUS,
      default: "draft",
      index: true
    },
    expectedDelivery: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);