import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as ctrl from "../controllers/inventoryRequestController.js";

const router = Router();

router.post("/", protect, authorize("staff"), ctrl.create);
router.get("/my", protect, authorize("staff"), ctrl.mine);
router.get("/", protect, authorize("mess_committee", "admin"), ctrl.all);
router.patch("/:id/decide", protect, authorize("mess_committee", "admin"), ctrl.decide);

export default router;