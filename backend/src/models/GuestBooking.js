import mongoose from "mongoose";

const guestBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealSession",
      required: true,
      index: true
    },
    date: { type: Date, required: true, index: true },
    guestCount: { type: Number, required: true, min: 1, max: 20 },
    pricePerGuest: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    guestNames: { type: [String], default: [] },
    notes: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, default: "" },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" }
  },
  { timestamps: true }
);

guestBookingSchema.index({ user: 1, session: 1 });

export const GuestBooking = mongoose.model("GuestBooking", guestBookingSchema);