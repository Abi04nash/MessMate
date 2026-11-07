export const INVENTORY_CATEGORIES = Object.freeze({
  RICE: "rice",
  WHEAT: "wheat",
  VEGETABLES: "vegetables",
  FRUITS: "fruits",
  PULSES: "pulses",
  DAIRY: "dairy",
  COOKING_OIL: "cooking_oil",
  SPICES: "spices",
  MEAT: "meat",
  CLEANING: "cleaning",
  OTHER: "other"
});

export const ALL_INVENTORY_CATEGORIES = Object.values(INVENTORY_CATEGORIES);

export const INVENTORY_UNITS = Object.freeze({
  KG: "kg",
  GRAM: "g",
  LITRE: "l",
  ML: "ml",
  PIECE: "piece",
  PACKET: "packet",
  DOZEN: "dozen"
});

export const ALL_INVENTORY_UNITS = Object.values(INVENTORY_UNITS);

export const STOCK_MOVEMENT_TYPES = Object.freeze({
  PURCHASE: "purchase",
  CONSUMPTION: "consumption",
  ADJUSTMENT: "adjustment",
  WASTAGE: "wastage",
  RETURN: "return"
});

export const ALL_STOCK_MOVEMENT_TYPES = Object.values(STOCK_MOVEMENT_TYPES);

export const PURCHASE_ORDER_STATUS = Object.freeze({
  DRAFT: "draft",
  SENT: "sent",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
});

export const ALL_PURCHASE_ORDER_STATUS = Object.values(PURCHASE_ORDER_STATUS);