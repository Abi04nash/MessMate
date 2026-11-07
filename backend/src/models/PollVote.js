import mongoose from "mongoose";

const pollVoteSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    optionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    optionIndex: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });
pollVoteSchema.index({ poll: 1, optionIndex: 1 });

export const PollVote = mongoose.model("PollVote", pollVoteSchema);