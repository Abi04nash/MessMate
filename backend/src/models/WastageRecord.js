import mongoose from "mongoose";
import { ALL_INVENTORY_UNITS } from "../constants/inventory.js";

const wastageRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealSession",
      index: true,
      sparse: true
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: 120
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.01, "Quantity must be greater than 0"]
    },
    unit: {
      type: String,
      enum: {
        values: ALL_INVENTORY_UNITS,
        message: "Invalid unit. Use kg, g, l, ml, piece, packet, or dozen."
      },
      required: [true, "Unit is required"]
    },
    reason: {
      type: String,
      enum: {
        values: ["leftover", "spoiled", "overcooked", "other"],
        message: "Reason must be leftover, spoiled, overcooked, or other."
      },
      default: "leftover"
    },
    estimatedCost: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

wastageRecordSchema.index({ date: -1 });

export const WastageRecord = mongoose.model("WastageRecord", wastageRecordSchema);