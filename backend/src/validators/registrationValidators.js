import { z } from "zod";

export const createRegistrationSchema = z.object({
  sessionId: z.string().min(1, "sessionId required")
});