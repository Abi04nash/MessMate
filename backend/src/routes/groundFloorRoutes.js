import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/groundFloorController.js";

const router = Router();
router.use(protect, authorize("student"));
router.get("/info", ctrl.info);
router.post("/enroll", ctrl.enroll);
router.get("/my", ctrl.my);

export default router;