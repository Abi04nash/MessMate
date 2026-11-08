import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/userController.js";
const router = Router();
router.get("/", protect, authorize("mess_committee", "admin"), ctrl.list);
router.patch("/:id/status", protect, authorize("mess_committee", "admin"), ctrl.setStatus);
router.patch("/me", protect, ctrl.me);
export default router;