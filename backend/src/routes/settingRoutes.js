import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/settingController.js";

const router = Router();

// Read: admin + mess_committee can view
router.get("/", protect, authorize("admin", "mess_committee"), ctrl.list);

// Write: ADMIN ONLY - mess_committee has no write access
router.put("/:key", protect, authorize("admin"), ctrl.upsert);

export default router;