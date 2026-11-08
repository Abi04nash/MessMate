import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/guestBookingController.js";
const router = Router();
router.post("/", protect, authorize("student"), ctrl.create);
router.get("/my", protect, authorize("student"), ctrl.mine);
router.get("/", protect, authorize("mess_committee", "admin"), ctrl.all);
router.patch("/:id/decide", protect, authorize("mess_committee", "admin"), ctrl.decide);
export default router;