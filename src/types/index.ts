export type Dietary = "vegetarian" | "vegan" | "non-vegetarian" | "eggetarian" | "pescatarian";

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItemModifier {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  dietary: Dietary;
  spicyLevel: 0 | 1 | 2 | 3;
  isFeatured: boolean;
  isPopular: boolean;
  available: boolean;
  preparationTime: number;
  allergens: string[];
  servings: number;
  modifiers: MenuItemModifier[];
  categoryId: string;
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string | null;
  order: number;
  itemCount: number;
}

export type Currency = {
  code: string;
  symbol: string;
  locale: string;
};

export interface Restaurant {
  id: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  hours: Record<string, string>;
  location: {
    lat: number;
    lng: number;
  };
  currency: Currency;
  branding: {
    primaryImage: string;
    logo: string | null;
  };
  taxes: Tax[];
  serviceCharge: number;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: "percentage" | "fixed";
}

export type TableStatus = "free" | "occupied" | "reserved" | "cleaning";

export interface Table {
  id: string;
  number: string;
  name: string;
  capacity: number;
  status: TableStatus;
  sessionId: string | null;
}

export type SessionStatus =
  | "ACTIVE"
  | "BILL_REQUESTED"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED";

export interface LocationValidation {
  restaurantLat: number;
  restaurantLng: number;
  allowedRadiusMeters: number;
  customerLat: number | null;
  customerLng: number | null;
  validatedAt: string | null;
  status: "pending" | "verified" | "unverified" | "denied" | "unavailable";
}

export interface DiningSession {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  status: SessionStatus;
  sessionIdentifier: string;
  createdAt: string;
  updatedAt: string;
  locationValidation: LocationValidation;
  orders: Order[];
  runningTotal: number;
}

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

export interface Customization {
  modifierId: string;
  modifierName: string;
  optionIds: string[];
  optionNames: string[];
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  customizations: Customization[];
  specialInstructions: string;
  total: number;
}

export interface Order {
  id: string;
  sessionId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  estimatedReadyAt: string | null;
  servedAt: string | null;
}

export interface BillItem {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
}

export interface Bill {
  id: string;
  sessionId: string;
  items: BillItem[];
  subtotal: number;
  taxes: { name: string; amount: number }[];
  serviceCharge: number;
  total: number;
  status: "pending" | "requested" | "paid" | "failed";
  notes: string;
  createdAt: string;
  updatedAt: string;
  payment: Payment | null;
}

export type PaymentMethod = "card" | "upi" | "cash" | "wallet";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  transactionId: string | null;
  createdAt: string;
  completedAt: string | null;
}
