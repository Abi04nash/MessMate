import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, default: 0 }
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", maxlength: 1000 },
    options: { type: [optionSchema], validate: (v) => v.length >= 2 },
    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "draft",
      index: true
    },
    startAt: { type: Date },
    endAt: { type: Date },
    resultsVisible: { type: Boolean, default: true },
    allowMultiple: { type: Boolean, default: false },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

pollSchema.index({ status: 1, createdAt: -1 });

export const Poll = mongoose.model("Poll", pollSchema);