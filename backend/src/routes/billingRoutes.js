import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { generateBillSchema, adjustmentSchema } from "../validators/billingValidators.js";
import * as ctrl from "../controllers/billingController.js";

const router = Router();

router.get("/my", protect, authorize("student"), ctrl.my);
router.get("/running", protect, authorize("student"), ctrl.running);
router.get("/debug", protect, authorize("student"), ctrl.debug);
router.post("/reset-payments", protect, authorize("student"), ctrl.reset);
router.get("/:id", protect, ctrl.detail);
router.get("/", protect, authorize("mess_committee", "admin"), ctrl.all);
router.post("/generate", protect, authorize("mess_committee", "admin"), validate(generateBillSchema), ctrl.generate);
router.post("/adjustments", protect, authorize("mess_committee", "admin"), validate(adjustmentSchema), ctrl.adjust);

export default router;