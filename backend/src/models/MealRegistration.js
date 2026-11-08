import mongoose from "mongoose";
import { REGISTRATION_STATUS } from "../constants/statuses.js";

const mealRegistrationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "MealSession", required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.REGISTERED,
      index: true
    },
    billingExempt: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, default: "" }
  },
  { timestamps: true }
);

mealRegistrationSchema.index({ user: 1, session: 1 }, { unique: true });

export const MealRegistration = mongoose.model("MealRegistration", mealRegistrationSchema);