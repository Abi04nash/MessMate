import mongoose from "mongoose";
import { ALL_MEAL_CATEGORIES } from "../constants/meals.js";
import { MEAL_SESSION_STATUS } from "../constants/statuses.js";

const mealSessionSchema = new mongoose.Schema(
  {
    menu: { type: mongoose.Schema.Types.ObjectId, ref: "MealMenu", required: true, index: true },
    date: { type: Date, required: true, index: true },
    category: { type: String, enum: ALL_MEAL_CATEGORIES, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(MEAL_SESSION_STATUS),
      default: MEAL_SESSION_STATUS.SCHEDULED,
      index: true
    },
    registrationCutoff: { type: Date },
    cancellationCutoff: { type: Date },
    expectedCount: { type: Number, default: 0, min: 0 },
    registeredCount: { type: Number, default: 0, min: 0 },
    attendedCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

mealSessionSchema.index({ date: 1, category: 1 }, { unique: true });

export const MealSession = mongoose.model("MealSession", mealSessionSchema);