import { z } from "zod";

export const generateBillSchema = z.object({
  userId: z.string().min(1),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100)
});

export const initiatePaymentSchema = z.object({
  billId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["upi", "card", "netbanking", "cash"])
});

export const payDirectSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["upi", "card", "netbanking", "cash"])
});

export const adjustmentSchema = z.object({
  userId: z.string().min(1),
  billId: z.string().optional(),
  amount: z.coerce.number().positive(),
  type: z.enum(["credit", "debit"]),
  category: z.enum(["discount", "refund", "penalty", "leave_credit", "guest_meal", "other"]).optional(),
  reason: z.string().min(3).max(500)
});