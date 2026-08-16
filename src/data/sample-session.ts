import type { DiningSession, MenuItem, Order } from "@/types";
import { MENU_ITEMS } from "@/data/menu";
import { RESTAURANT } from "@/data/restaurant";
import { TABLES } from "@/data/tables";

const item = (slug: string) =>
  (MENU_ITEMS as readonly MenuItem[]).find((i) => i.slug === slug) as MenuItem;

function order(
  id: string,
  slug: string,
  quantity: number,
  status: Order["status"],
  minsAgo: number,
  customizations: { modifierName: string; optionNames: string[]; price: number }[] = [],
  note: string = "",
): Order {
  const it = item(slug);
  const customizationPrice = customizations.reduce((s, c) => s + c.price, 0);
  const unit = Math.round(it.price * quantity) + customizationPrice;
  const taxRate = RESTAURANT.taxes[0].rate + RESTAURANT.taxes[1].rate;
  const tax = Math.round((unit * taxRate) / 100);
  const service = Math.round((unit * RESTAURANT.serviceCharge) / 100);
  const total = unit + tax + service;
  const now = Date.now() - minsAgo * 60 * 1000;
  const d = new Date(now);
  return {
    id,
    sessionId: "demo-session",
    status,
    items: [
      {
        id: `${id}-i1`,
        menuItemId: it.id,
        name: it.name,
        image: it.image,
        price: it.price,
        quantity,
        customizations: customizations.map((c) => ({
          modifierId: c.modifierName,
          modifierName: c.modifierName,
          optionIds: c.optionNames.map((_, i) => c.optionNames[i]),
          optionNames: c.optionNames,
          price: c.price,
        })),
        specialInstructions: note,
        total: unit,
      },
    ],
    subtotal: unit,
    taxAmount: tax,
    serviceCharge: service,
    total,
    notes: note,
    createdAt: d.toISOString(),
    updatedAt: d.toISOString(),
    estimatedReadyAt:
      status === "PENDING" || status === "ACCEPTED" || status === "PREPARING"
        ? new Date(now + (it.preparationTime + 8) * 60 * 1000).toISOString()
        : null,
    servedAt: status === "SERVED" || status === "COMPLETED" ? d.toISOString() : null,
  };
}

const ORDER_1 = order(
  "OR-1248",
  "butter-chicken",
  1,
  "SERVED",
  120,
  [{ modifierName: "Spice Level", optionNames: ["Medium"], price: 0 }],
);
const ORDER_2 = order(
  "OR-1256",
  "dal-makhani",
  1,
  "SERVED",
  75,
);
const ORDER_3 = order(
  "OR-1262",
  "mango-lassi",
  2,
  "PREPARING",
  12,
);
const ORDER_4 = order(
  "OR-1270",
  "paneer-tikka",
  1,
  "PENDING",
  3,
  [{ modifierName: "Garnish", optionNames: ["Lemon Wedge"], price: 10 }],
);

export const SAMPLE_ORDERS: Order[] = [ORDER_1, ORDER_2, ORDER_3, ORDER_4];

const table = TABLES.find((t) => t.number === "14")!;
const runningTotal = SAMPLE_ORDERS.reduce((s, o) => s + o.total, 0);

export const SAMPLE_SESSION: DiningSession = {
  id: "A8392",
  restaurantId: RESTAURANT.id,
  tableId: table.id,
  tableNumber: table.number,
  status: "ACTIVE",
  sessionIdentifier: "#A8392",
  createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  locationValidation: {
    restaurantLat: RESTAURANT.location.lat,
    restaurantLng: RESTAURANT.location.lng,
    allowedRadiusMeters: 80,
    customerLat: 12.9353,
    customerLng: 77.6248,
    validatedAt: new Date().toISOString(),
    status: "verified",
  },
  orders: SAMPLE_ORDERS,
  runningTotal,
};

export const SESSION_STEPS = [
  { label: "Arrive & Scan", description: "Scan the table QR code" },
  { label: "Join Session", description: "Confirm your table & location" },
  { label: "Browse Menu", description: "Discover the day's offerings" },
  { label: "Add to Cart", description: "Build your order" },
  { label: "Place Order", description: "Send to the kitchen" },
  { label: "Dining", description: "Continue ordering as you eat" },
  { label: "Request Bill", description: "Ask for the final bill" },
  { label: "Pay", description: "Settle up and depart" },
] as const;
