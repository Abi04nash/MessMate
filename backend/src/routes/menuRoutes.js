import { Router } from "express";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createMenuSchema } from "../validators/menuValidators.js";
import * as ctrl from "../controllers/menuController.js";

const router = Router();

router.get("/today", optionalAuth, ctrl.getTodayMenu);
router.get("/upcoming", optionalAuth, ctrl.getUpcoming);
router.get("/date/:date", ctrl.getMenuByDate);

router.get("/", protect, authorize("mess_admin", "warden", "staff"), ctrl.listMenus);
router.get("/:id", protect, authorize("mess_admin", "warden", "staff"), ctrl.getDetail);
router.post("/", protect, authorize("mess_admin", "warden"), validate(createMenuSchema), ctrl.createMenu);
router.put("/:id", protect, authorize("mess_admin", "warden"), ctrl.updateMenu);
router.post("/:id/publish", protect, authorize("mess_admin", "warden"), ctrl.publishMenu);
router.delete("/:id", protect, authorize("mess_admin", "warden"), ctrl.deleteMenu);

export default router;