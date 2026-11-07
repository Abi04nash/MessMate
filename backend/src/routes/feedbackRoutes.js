import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/feedbackController.js";
const router = Router();
router.post("/", protect, authorize("student"), ctrl.submit);
router.get("/my", protect, authorize("student"), ctrl.mine);
router.get("/", protect, authorize("mess_admin", "warden"), ctrl.all);
router.get("/stats", protect, authorize("mess_admin", "warden"), ctrl.stats);
export default router;