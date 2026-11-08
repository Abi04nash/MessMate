import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  generateQrSchema,
  verifyQrSchema,
  manualCheckInSchema
} from "../validators/attendanceValidators.js";
import * as ctrl from "../controllers/attendanceController.js";

const router = Router();

router.post("/qr/generate", protect, authorize("student"), validate(generateQrSchema), ctrl.generateQr);
router.post("/qr/verify", protect, authorize("staff", "mess_committee", "admin"), validate(verifyQrSchema), ctrl.verifyQr);
router.post("/manual", protect, authorize("staff", "mess_committee", "admin"), validate(manualCheckInSchema), ctrl.manual);
router.get("/my", protect, authorize("student"), ctrl.my);
router.get("/session/:sessionId", protect, authorize("staff", "mess_committee", "admin"), ctrl.bySession);

export default router;