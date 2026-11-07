import { z } from "zod";

const categories = [
  "food_quality","hygiene","drinking_water","food_quantity","staff_behaviour",
  "mess_cleanliness","billing","infrastructure","menu","other"
];

export const createComplaintSchema = z.object({
  category: z.enum(categories),
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(3000),
  priority: z.enum(["low","medium","high","urgent"]).optional().default("medium"),
  images: z.array(z.string().url()).max(5).optional().default([])
});

export const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  isInternal: z.boolean().optional().default(false)
});

export const updateStatusSchema = z.object({
  status: z.enum(["under_review","assigned","in_progress","resolved","rejected","escalated"]),
  assignedTo: z.string().optional(),
  resolutionNote: z.string().max(1000).optional()
});

export const ratingSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  ratingComment: z.string().max(500).optional().default("")
});