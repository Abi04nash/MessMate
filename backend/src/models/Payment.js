import mongoose from "mongoose";
import { PAYMENT_STATUS, PAYMENT_METHOD } from "../constants/statuses.js";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    provider: { type: String, default: "mock" },
    providerRef: { type: String, index: true, sparse: true },
    providerOrderId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true
    },
    paidAt: { type: Date },
    failureReason: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

paymentSchema.index({ provider: 1, providerRef: 1 }, { unique: true, sparse: true });

export const Payment = mongoose.model("Payment", paymentSchema);