import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/pollController.js";
const router = Router();
router.get("/active", protect, ctrl.active);
router.post("/:id/vote", protect, authorize("student"), ctrl.vote);
router.get("/:id/results", protect, ctrl.results);
router.post("/", protect, authorize("mess_committee", "admin"), ctrl.create);
export default router;