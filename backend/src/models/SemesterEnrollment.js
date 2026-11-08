import mongoose from "mongoose";
import { ALL_MEAL_CATEGORIES } from "../constants/meals.js";

const semesterEnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    meals: {
      type: [{ type: String, enum: ALL_MEAL_CATEGORIES }],
      required: true,
      validate: {
        validator: (v) => v.length >= 3 && v.length <= 4,
        message: "Choose at least 3 meals"
      }
    },
    amount: { type: Number, required: true, min: 0 },
    semesterStart: { type: Date, required: true },
    semesterEnd: { type: Date, required: true },
    paidAt: { type: Date, required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    status: { type: String, enum: ["active", "cancelled"], default: "active", index: true }
  },
  { timestamps: true }
);

semesterEnrollmentSchema.index({ user: 1, status: 1 });

export const SemesterEnrollment = mongoose.model("SemesterEnrollment", semesterEnrollmentSchema);