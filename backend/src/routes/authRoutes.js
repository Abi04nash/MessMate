import { Router } from "express";
import { authLimiter } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { csrfProtection } from "../middleware/csrf.js";
import { protect } from "../middleware/auth.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema
} from "../validators/authValidators.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", protect, authController.me);
router.post(
  "/change-password",
  protect,
  csrfProtection,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;