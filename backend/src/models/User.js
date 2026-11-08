import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ALL_ROLES, LEGACY_ROLES } from "../constants/roles.js";

const allValidRoles = [...ALL_ROLES, ...Object.values(LEGACY_ROLES)];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: allValidRoles, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected"],
      default: "pending",
      index: true
    },
    studentId: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
    phone: { type: String, trim: true, maxlength: 20 },
    profileImageUrl: { type: String, default: "" },
    hostel: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel" },
    roomNumber: { type: String, trim: true, maxlength: 20 },
    semester: { type: Number, min: 1, max: 12 },
    messSystem: {
      type: String,
      enum: ["1st_floor", "ground_floor", null],
      default: null
    },
    designation: { type: String, trim: true, maxlength: 80 },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ role: 1, status: 1 });

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model("User", userSchema);