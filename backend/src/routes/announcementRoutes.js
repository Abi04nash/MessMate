import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/announcementController.js";
const router = Router();
router.get("/", protect, ctrl.list);
router.post("/", protect, authorize("mess_committee", "admin"), ctrl.create);
router.post("/:id/publish", protect, authorize("mess_committee", "admin"), ctrl.publish);
export default router;