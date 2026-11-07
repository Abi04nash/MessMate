import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  dietary: z.enum(["veg", "non_veg", "vegan", "egg"]).optional().default("veg"),
  allergens: z.array(z.string()).optional().default([]),
  special: z.boolean().optional().default(false)
});

const mealSlotSchema = z.object({
  category: z.enum(["breakfast", "lunch", "snacks", "dinner"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM required"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM required"),
  items: z.array(itemSchema).optional().default([]),
  serving: z.boolean().optional().default(true)
});

export const createMenuSchema = z.object({
  date: z.coerce.date(),
  meals: z.array(mealSlotSchema).min(1, "At least one meal required"),
  notes: z.string().max(1000).optional().default(""),
  published: z.boolean().optional().default(false)
});