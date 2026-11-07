import mongoose from "mongoose";
import { ALL_NOTIFICATION_TYPES } from "../constants/notifications.js";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ALL_NOTIFICATION_TYPES,
      default: "general",
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, default: "", maxlength: 1000 },
    link: { type: String, default: "" },
    readAt: { type: Date, default: null, index: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);