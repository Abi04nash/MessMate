import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/settingController.js";
const router = Router();
router.get("/", protect, authorize("mess_admin", "warden"), ctrl.list);
router.put("/:key", protect, authorize("warden"), ctrl.upsert);
export default router;