export const USER_STATUS = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  REJECTED: "rejected"
});

export const REGISTRATION_STATUS = Object.freeze({
  REGISTERED: "registered",
  CANCELLED: "cancelled",
  ATTENDED: "attended",
  NO_SHOW: "no_show"
});

export const MEAL_SESSION_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  PREPARING: "preparing",
  READY: "ready",
  SERVING: "serving",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
});

export const BILL_STATUS = Object.freeze({
  DRAFT: "draft",
  ISSUED: "issued",
  PARTIALLY_PAID: "partially_paid",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled"
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  REFUNDED: "refunded"
});

export const PAYMENT_METHOD = Object.freeze({
  UPI: "upi",
  CARD: "card",
  NETBANKING: "netbanking",
  CASH: "cash"
});

export const COMPLAINT_STATUS = Object.freeze({
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
  ESCALATED: "escalated"
});

export const COMPLAINT_PRIORITY = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
});

export const COMPLAINT_CATEGORY = Object.freeze({
  FOOD_QUALITY: "food_quality",
  HYGIENE: "hygiene",
  DRINKING_WATER: "drinking_water",
  FOOD_QUANTITY: "food_quantity",
  STAFF_BEHAVIOUR: "staff_behaviour",
  MESS_CLEANLINESS: "mess_cleanliness",
  BILLING: "billing",
  INFRASTRUCTURE: "infrastructure",
  MENU: "menu",
  OTHER: "other"
});

export const LEAVE_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled"
});