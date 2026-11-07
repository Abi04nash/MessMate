import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    gender: { type: String, enum: ["male", "female", "mixed"], default: "mixed" },
    capacity: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Hostel = mongoose.model("Hostel", hostelSchema);