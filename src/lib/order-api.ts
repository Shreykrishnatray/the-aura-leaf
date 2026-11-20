import { fetchJson } from "./api-client";
import type { Order, OrderStatus } from "@/types";

export interface CreateOrderItemPayload {
  menuItemId: string;
  quantity: number;
  specialInstructions: string;
  customizations: { modifierId: string; optionIds: string[] }[];
}

export interface CreateOrderPayload {
  sessionId: string;
  sessionIdentifier: string;
  tableNumber: string;
  notes?: string;
  items: CreateOrderItemPayload[];
}

/** Persists the cart as an order and returns the server-calculated result. */
export function submitOrder(payload: CreateOrderPayload): Promise<Order> {
  return fetchJson<Order>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchSessionOrders(sessionId: string): Promise<Order[]> {
  return fetchJson<Order[]>(`/api/orders?sessionId=${encodeURIComponent(sessionId)}`);
}

export function patchOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  return fetchJson<Order>(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
