import mongoose from "mongoose";
import { LEAVE_STATUS } from "../constants/statuses.js";
import { ALL_MEAL_CATEGORIES } from "../constants/meals.js";

const leaveRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    affectedCategories: {
      type: [{ type: String, enum: ALL_MEAL_CATEGORIES }],
      default: []
    },
    reason: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(LEAVE_STATUS),
      default: LEAVE_STATUS.PENDING,
      index: true
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    remarks: { type: String, default: "" },
    billingImpact: { type: Number, default: 0 }
  },
  { timestamps: true }
);

leaveRequestSchema.index({ user: 1, fromDate: 1, toDate: 1 });

export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);