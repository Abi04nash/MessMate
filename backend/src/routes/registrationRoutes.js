import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createRegistrationSchema } from "../validators/registrationValidators.js";
import * as ctrl from "../controllers/registrationController.js";

const router = Router();

router.get("/my", protect, authorize("student"), ctrl.my);
router.post("/", protect, authorize("student"), validate(createRegistrationSchema), ctrl.create);
router.delete("/:id", protect, authorize("student"), ctrl.cancel);
router.get("/session/:sessionId", protect, authorize("mess_committee", "admin", "staff"), ctrl.bySession);

export default router;