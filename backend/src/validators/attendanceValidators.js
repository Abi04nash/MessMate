import { z } from "zod";

export const generateQrSchema = z.object({
  sessionId: z.string().min(1, "sessionId required")
});

export const verifyQrSchema = z.object({
  qrToken: z.string().min(1, "qrToken required")
});

export const manualCheckInSchema = z.object({
  registrationId: z.string().min(1, "registrationId required"),
  sessionId: z.string().optional()
});