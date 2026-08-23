"use client";

import type { DiningSession, Order, OrderItem, OrderStatus, SessionStatus } from "@/types";
import { STORAGE_KEYS } from "@/config/constants";
import { RESTAURANT } from "@/data/restaurant";

function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateOrderId(): string {
  return `OR-${1000 + Math.floor(Math.random() * 9000)}`;
}

function generateSessionId(): string {
  return generateId();
}

export function loadSession(tableNumber: string): DiningSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DINING_SESSION);
    if (!raw) return null;
    const session: DiningSession = JSON.parse(raw);
    if (session.tableNumber === tableNumber && session.status !== "COMPLETED" && session.status !== "CANCELLED") {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: DiningSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.DINING_SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.DINING_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CART);
}

export function createSession(tableNumber: string): DiningSession {
  const now = new Date().toISOString();
  const session: DiningSession = {
    id: generateSessionId(),
    restaurantId: RESTAURANT.id,
    tableId: `t${tableNumber}`,
    tableNumber,
    status: "ACTIVE",
    sessionIdentifier: `#${generateSessionId()}`,
    createdAt: now,
    updatedAt: now,
    locationValidation: {
      restaurantLat: RESTAURANT.location.lat,
      restaurantLng: RESTAURANT.location.lng,
      allowedRadiusMeters: 80,
      customerLat: null,
      customerLng: null,
      validatedAt: null,
      status: "pending",
    },
    orders: [],
    runningTotal: 0,
  };
  saveSession(session);
  return session;
}

export function addOrderToSession(session: DiningSession, items: OrderItem[]): DiningSession {
  const now = new Date().toISOString();
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = RESTAURANT.taxes.reduce((sum, t) => sum + t.rate, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const serviceCharge = Math.round((subtotal * RESTAURANT.serviceCharge) / 100);
  const total = subtotal + taxAmount + serviceCharge;

  const order: Order = {
    id: generateOrderId(),
    sessionId: session.id,
    status: "PENDING",
    items,
    subtotal,
    taxAmount,
    serviceCharge,
    total,
    notes: "",
    createdAt: now,
    updatedAt: now,
    estimatedReadyAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    servedAt: null,
  };

  const updated: DiningSession = {
    ...session,
    orders: [...session.orders, order],
    runningTotal: session.runningTotal + total,
    updatedAt: now,
  };
  saveSession(updated);
  return updated;
}

export function updateOrderStatus(session: DiningSession, orderId: string, status: OrderStatus): DiningSession {
  const now = new Date().toISOString();
  const updatedOrders = session.orders.map((o) =>
    o.id === orderId
      ? {
          ...o,
          status,
          updatedAt: now,
          servedAt: status === "SERVED" ? now : o.servedAt,
        }
      : o
  );
  const updated: DiningSession = {
    ...session,
    orders: updatedOrders,
    updatedAt: now,
  };
  saveSession(updated);
  return updated;
}

export function updateSessionStatus(session: DiningSession, status: SessionStatus): DiningSession {
  const now = new Date().toISOString();
  const updated: DiningSession = {
    ...session,
    status,
    updatedAt: now,
  };
  saveSession(updated);
  return updated;
}

export function calculateBillTotals(session: DiningSession) {
  const subtotal = session.orders.reduce((sum, o) => sum + o.subtotal, 0);
  const taxAmount = session.orders.reduce((sum, o) => sum + o.taxAmount, 0);
  const serviceCharge = session.orders.reduce((sum, o) => sum + o.serviceCharge, 0);
  const total = session.orders.reduce((sum, o) => sum + o.total, 0);
  return { subtotal, taxAmount, serviceCharge, total };
}
