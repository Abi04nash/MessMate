import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { initiatePaymentSchema, payDirectSchema } from "../validators/billingValidators.js";
import * as ctrl from "../controllers/paymentController.js";

const router = Router();

// Direct pay from running bill (used by Bills page)
router.post("/pay", protect, authorize("student"), validate(payDirectSchema), ctrl.pay);

// Pay against a specific bill (legacy)
router.post("/initiate", protect, authorize("student"), validate(initiatePaymentSchema), ctrl.initiate);

// My payments
router.get("/my", protect, authorize("student"), ctrl.my);

// Detail
router.get("/:id", protect, ctrl.detail);

// All payments (admin/warden)
router.get("/", protect, authorize("mess_committee", "admin"), ctrl.all);

export default router;