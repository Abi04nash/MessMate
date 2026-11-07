import mongoose from "mongoose";

const billingAdjustmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    category: {
      type: String,
      enum: ["discount", "refund", "penalty", "leave_credit", "guest_meal", "other"],
      default: "other"
    },
    reason: { type: String, required: true, maxlength: 500 },
    appliedToBill: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const BillingAdjustment = mongoose.model("BillingAdjustment", billingAdjustmentSchema);