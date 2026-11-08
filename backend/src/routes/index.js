import { Router } from "express";
import { sendSuccess } from "../utils/apiResponse.js";
import authRoutes from "./authRoutes.js";
import menuRoutes from "./menuRoutes.js";
import registrationRoutes from "./registrationRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import billingRoutes from "./billingRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import complaintRoutes from "./complaintRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import userRoutes from "./userRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";
import guestBookingRoutes from "./guestBookingRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import inventoryRequestRoutes from "./inventoryRequestRoutes.js";
import wastageRoutes from "./wastageRoutes.js";
import pollRoutes from "./pollRoutes.js";
import settingRoutes from "./settingRoutes.js";
import groundFloorRoutes from "./groundFloorRoutes.js";

const router = Router();

router.get("/", (req, res) => sendSuccess(res, {
  message: "MESSMATE API v1",
  data: { name: "MESSMATE", version: "1.0.0" }
}));

router.use("/auth", authRoutes);
router.use("/menus", menuRoutes);
router.use("/registrations", registrationRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/billing", billingRoutes);
router.use("/payments", paymentRoutes);
router.use("/complaints", complaintRoutes);
router.use("/leaves", leaveRoutes);
router.use("/users", userRoutes);
router.use("/announcements", announcementRoutes);
router.use("/notifications", notificationRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/guest-bookings", guestBookingRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/inventory-requests", inventoryRequestRoutes);
router.use("/wastage", wastageRoutes);
router.use("/polls", pollRoutes);
router.use("/settings", settingRoutes);
router.use("/ground-floor", groundFloorRoutes);

export default router;