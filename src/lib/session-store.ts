"use client";

import type { DiningSession, Order, SessionStatus } from "@/types";
import { STORAGE_KEYS } from "@/config/constants";
import { RESTAURANT } from "@/data/restaurant";

function normalizeTableNumber(value: string): string {
  return value.trim().replace(/^T/i, "");
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
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
    const normalizedTable = normalizeTableNumber(tableNumber);
    if (
      normalizeTableNumber(session.tableNumber) === normalizedTable &&
      session.status !== "COMPLETED" &&
      session.status !== "CANCELLED"
    ) {
      const normalizedSession = {
        ...session,
        tableNumber: normalizedTable,
        tableId: `t${normalizedTable}`,
      };
      saveSession(normalizedSession);
      return normalizedSession;
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
  const normalizedTable = normalizeTableNumber(tableNumber);
  const now = new Date().toISOString();
  const session: DiningSession = {
    id: generateSessionId(),
    restaurantId: RESTAURANT.id,
    tableId: `t${normalizedTable}`,
    tableNumber: normalizedTable,
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

export function addOrderToSession(session: DiningSession, order: Order): DiningSession {
  const now = new Date().toISOString();
  const updated: DiningSession = {
    ...session,
    orders: [...session.orders, order],
    runningTotal: session.runningTotal + order.total,
    updatedAt: now,
  };
  saveSession(updated);
  return updated;
}

/** Replaces a local order with the database copy (e.g. after a status change). */
export function applyServerOrder(session: DiningSession, order: Order): DiningSession {
  const updated: DiningSession = {
    ...session,
    orders: session.orders.map((existing) => (existing.id === order.id ? order : existing)),
    updatedAt: new Date().toISOString(),
  };
  saveSession(updated);
  return updated;
}

/**
 * Merges orders loaded from the API into the locally cached session.
 * Server copies win for matching ids; local-only orders are kept so a
 * temporarily unavailable API never wipes the user's screen.
 */
export function mergeOrdersFromServer(session: DiningSession, orders: Order[]): DiningSession {
  const byId = new Map(session.orders.map((order) => [order.id, order]));
  for (const order of orders) byId.set(order.id, order);
  const merged = [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const updated: DiningSession = {
    ...session,
    orders: merged,
    runningTotal: merged.reduce((sum, order) => sum + order.total, 0),
    updatedAt: new Date().toISOString(),
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
