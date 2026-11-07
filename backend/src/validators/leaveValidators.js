import { z } from "zod";

export const createLeaveSchema = z.object({
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  affectedCategories: z.array(z.enum(["breakfast", "lunch", "snacks", "dinner"])).optional().default([]),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000)
}).refine((d) => d.toDate >= d.fromDate, { message: "toDate must be after fromDate" });

export const decideLeaveSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  remarks: z.string().max(500).optional().default("")
});