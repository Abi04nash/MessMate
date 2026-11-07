import mongoose from "mongoose";
import { ALL_ANNOUNCEMENT_CATEGORIES } from "../constants/notifications.js";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ALL_ANNOUNCEMENT_CATEGORIES,
      default: "general",
      index: true
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal"
    },
    targetRoles: { type: [String], default: [] },
    published: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

announcementSchema.index({ published: 1, publishedAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);