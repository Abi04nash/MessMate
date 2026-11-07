import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "MealSession", required: true, index: true },
    registration: { type: mongoose.Schema.Types.ObjectId, ref: "MealRegistration", required: true },
    date: { type: Date, required: true, index: true },
    attendedAt: { type: Date, required: true, default: () => new Date() },
    method: { type: String, enum: ["qr", "manual"], default: "qr" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    nonce: { type: String, default: "" }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, session: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);