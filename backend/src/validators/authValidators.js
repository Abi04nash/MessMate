import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  studentId: z.string().trim().min(3, "Student ID required").max(30),
  phone: z.string().trim().max(20).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email required"),
  password: z.string().min(1, "Password required")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128)
});