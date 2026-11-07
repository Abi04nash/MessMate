import mongoose from "mongoose";
import { ALL_MEAL_CATEGORIES, ALL_DIETARY_LABELS } from "../constants/meals.js";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dietary: { type: String, enum: ALL_DIETARY_LABELS, default: "veg" },
    allergens: { type: [String], default: [] },
    special: { type: Boolean, default: false }
  },
  { _id: false }
);

const mealSlotSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ALL_MEAL_CATEGORIES, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    items: { type: [itemSchema], default: [] },
    serving: { type: Boolean, default: true }
  },
  { _id: false }
);

const mealMenuSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    meals: { type: [mealSlotSchema], default: [] },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

mealMenuSchema.index({ date: 1 }, { unique: true });

export const MealMenu = mongoose.model("MealMenu", mealMenuSchema);