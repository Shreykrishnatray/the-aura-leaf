export const APP_NAME = "The Aura Leaf";
export const APP_TAGLINE = "Scan. Savour. Stay.";

export const COLORS = {
  cream: "#f9f6f0",
  stone: "#e5e1da",
  sage: "#a3b18a",
  forest: "#2a5d44",
  forestDark: "#243d33",
  gold: "#c9a66b",
  goldDeep: "#a67f47",
  charcoal: "#2d2b2b",
  ink: "#111815",
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const MAX_MOBILE_WIDTH = 480;

export const SESSION_STATUSES = ["ACTIVE", "BILL_REQUESTED", "PAYMENT_PENDING", "COMPLETED", "CANCELLED"] as const;
export const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Received",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancelled",
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Dining",
  BILL_REQUESTED: "Bill Requested",
  PAYMENT_PENDING: "Payment Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  non-vegetarian: "Non-Vegetarian",
  eggetarian: "Eggetarian",
  pescatarian: "Pescatarian",
};

export const SPICY_LABELS: Record<number, string> = {
  0: "Mild",
  1: "Medium",
  2: "Hot",
  3: "Extra Hot",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Card",
  upi: "UPI",
  cash: "Cash",
  wallet: "Wallet",
};

export const STORAGE_KEYS = {
  DINING_SESSION: "aura_leaf_session",
  CART: "aura_leaf_cart",
  TABLE: "aura_leaf_table",
  LOCATION: "aura_leaf_location",
};

export const TABLE_LOCATION_RADIUS_METERS = 80;
