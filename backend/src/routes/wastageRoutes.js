import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/wastageController.js";

const router = Router();

router.use(protect);

// Staff - their own records
router.get("/my", authorize("staff"), ctrl.mine);

// Admin/warden - all records
router.get("/stats", authorize("mess_admin", "warden"), ctrl.stats);
router.get("/", authorize("mess_admin", "warden"), ctrl.list);

// Staff & admin can create
router.post("/", authorize("staff", "mess_admin"), ctrl.create);

export default router;