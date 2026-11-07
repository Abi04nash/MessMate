export const NOTIFICATION_TYPES = Object.freeze({
  ANNOUNCEMENT: "announcement",
  MENU_PUBLISHED: "menu_published",
  COMPLAINT_UPDATE: "complaint_update",
  LEAVE_DECISION: "leave_decision",
  PAYMENT_UPDATE: "payment_update",
  MEAL_REMINDER: "meal_reminder",
  ATTENDANCE_CONFIRMATION: "attendance_confirmation",
  INVENTORY_ALERT: "inventory_alert",
  KITCHEN_STATUS: "kitchen_status",
  GENERAL: "general"
});

export const ALL_NOTIFICATION_TYPES = Object.values(NOTIFICATION_TYPES);

export const ANNOUNCEMENT_CATEGORIES = Object.freeze({
  MENU_CHANGE: "menu_change",
  SPECIAL_DINNER: "special_dinner",
  MESS_HOLIDAY: "mess_holiday",
  MAINTENANCE: "maintenance",
  PAYMENT_REMINDER: "payment_reminder",
  GENERAL: "general"
});

export const ALL_ANNOUNCEMENT_CATEGORIES = Object.values(ANNOUNCEMENT_CATEGORIES);