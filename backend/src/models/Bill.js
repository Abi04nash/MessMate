import mongoose from "mongoose";
import { BILL_STATUS } from "../constants/statuses.js";

const lineItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2020, max: 2100 },
    items: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0, min: 0 },
    adjustmentsTotal: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    outstanding: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(BILL_STATUS),
      default: BILL_STATUS.DRAFT,
      index: true
    },
    dueDate: { type: Date },
    issuedAt: { type: Date },
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

billSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

export const Bill = mongoose.model("Bill", billSchema);