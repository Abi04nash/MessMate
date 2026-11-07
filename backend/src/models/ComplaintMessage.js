import mongoose from "mongoose";

const complaintMessageSchema = new mongoose.Schema(
  {
    complaint: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, maxlength: 2000 },
    isInternal: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ComplaintMessage = mongoose.model("ComplaintMessage", complaintMessageSchema);