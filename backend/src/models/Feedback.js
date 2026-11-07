import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
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
    taste: { type: Number, min: 1, max: 5, required: true },
    quality: { type: Number, min: 1, max: 5, required: true },
    hygiene: { type: Number, min: 1, max: 5, required: true },
    quantity: { type: Number, min: 1, max: 5, required: true },
    overall: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "", maxlength: 1000 },
    moderated: { type: Boolean, default: false },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date }
  },
  { timestamps: true }
);

feedbackSchema.index({ user: 1, session: 1 }, { unique: true });
feedbackSchema.index({ session: 1, overall: 1 });

export const Feedback = mongoose.model("Feedback", feedbackSchema);