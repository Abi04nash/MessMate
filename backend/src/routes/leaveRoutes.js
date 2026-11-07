import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createLeaveSchema, decideLeaveSchema } from "../validators/leaveValidators.js";
import * as ctrl from "../controllers/leaveController.js";

const router = Router();

router.use(protect);

// Debug/migration
router.get("/_debug/counts", authorize("mess_admin", "warden"), ctrl.debugCounts);
router.get("/_verify", authorize("mess_admin", "warden"), ctrl.verify);
router.post("/_migrate", authorize("mess_admin", "warden"), ctrl.migrate);

// Student refunds
router.post("/refunds", authorize("student"), validate(createLeaveSchema), ctrl.createRefund);
router.get("/refunds/my", authorize("student"), ctrl.myRefunds);
router.get("/refunds", authorize("mess_admin", "warden"), ctrl.allRefunds);

// Staff leaves
router.get("/my", authorize("staff"), ctrl.mine);
router.post("/", authorize("staff"), validate(createLeaveSchema), ctrl.create);
router.get("/", authorize("mess_admin", "warden"), ctrl.all);

// Shared
router.delete("/:id", ctrl.cancel);
router.patch("/:id/decide", authorize("mess_admin", "warden"), validate(decideLeaveSchema), ctrl.decide);

export default router;