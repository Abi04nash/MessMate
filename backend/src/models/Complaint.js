import mongoose from "mongoose";
import {
  COMPLAINT_STATUS,
  COMPLAINT_PRIORITY,
  COMPLAINT_CATEGORY
} from "../constants/statuses.js";

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: Object.values(COMPLAINT_CATEGORY), required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 3000 },
    priority: {
      type: String,
      enum: Object.values(COMPLAINT_PRIORITY),
      default: "medium",
      index: true
    },
    status: {
      type: String,
      enum: Object.values(COMPLAINT_STATUS),
      default: COMPLAINT_STATUS.SUBMITTED,
      index: true
    },
    images: { type: [String], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNote: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5 },
    ratingComment: { type: String, default: "" }
  },
  { timestamps: true }
);

complaintSchema.index({ status: 1, createdAt: -1 });

export const Complaint = mongoose.model("Complaint", complaintSchema);