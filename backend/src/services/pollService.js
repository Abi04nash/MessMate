import { Poll } from "../models/Poll.js";
import { PollVote } from "../models/PollVote.js";
import { ApiError } from "../utils/ApiError.js";
export async function create({ data, userId }) {
  return Poll.create({
    question: data.question, description: data.description || "",
    options: data.options.map((o, i) => ({ text: o, order: i })),
    status: "active", startAt: new Date(),
    endAt: data.endAt, resultsVisible: data.resultsVisible !== false,
    publishedBy: userId
  });
}
export async function active() {
  return Poll.find({ status: "active" }).sort({ createdAt: -1 }).lean();
}
export async function vote({ userId, pollId, optionId }) {
  const poll = await Poll.findById(pollId);
  if (!poll) throw new ApiError(404, "Poll not found");
  if (poll.status !== "active") throw new ApiError(409, "Poll closed");
  const opt = poll.options.id(optionId);
  if (!opt) throw new ApiError(400, "Invalid option");
  try {
    return await PollVote.create({
      poll: pollId, user: userId, optionId, optionIndex: poll.options.findIndex((o) => String(o._id) === String(optionId))
    });
  } catch (e) { if (e.code === 11000) throw new ApiError(409, "Already voted"); throw e; }
}
export async function results(pollId) {
  const poll = await Poll.findById(pollId).lean();
  if (!poll) throw new ApiError(404, "Not found");
  const counts = await PollVote.aggregate([
    { $match: { poll: poll._id } },
    { $group: { _id: "$optionIndex", count: { $sum: 1 } } }
  ]);
  return { poll, counts };
}