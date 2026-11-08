import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createComplaintSchema,
  messageSchema,
  updateStatusSchema,
  ratingSchema
} from "../validators/complaintValidators.js";
import * as ctrl from "../controllers/complaintController.js";

const router = Router();

router.get("/my", protect, authorize("student"), ctrl.mine);
router.post("/", protect, authorize("student"), validate(createComplaintSchema), ctrl.create);
router.get("/:id", protect, ctrl.detail);
router.post("/:id/messages", protect, validate(messageSchema), ctrl.addMessage);
router.post("/:id/rate", protect, authorize("student"), validate(ratingSchema), ctrl.rate);

router.get("/", protect, authorize("mess_committee", "admin"), ctrl.all);
router.patch("/:id/status", protect, authorize("mess_committee", "admin"), validate(updateStatusSchema), ctrl.updateStatus);

export default router;