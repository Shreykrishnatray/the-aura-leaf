"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { DiningSession, Order, OrderStatus, Customization } from "@/types";
import type { CartItem } from "@/lib/cart-store";
import * as sessionStore from "@/lib/session-store";
import * as cartStore from "@/lib/cart-store";
import { patchOrderStatus, submitOrder } from "@/lib/order-api";

interface AppState {
  session: DiningSession | null;
  cart: CartItem[];
  tableNumber: string | null;
  demoMode: boolean;
  orderError: string | null;
}

interface AppContextValue extends AppState {
  initSession: (tableNumber: string) => void;
  addItemToCart: (menuItem: import("@/types").MenuItem, quantity: number, customizations: Customization[], instructions: string) => void;
  updateCartItemQty: (itemId: string, quantity: number) => void;
  removeCartItem: (itemId: string) => void;
  emptyCart: () => void;
  placeOrder: () => Promise<DiningSession | null>;
  advanceOrderStatus: (orderId: string) => Promise<void>;
  syncOrders: (orders: Order[]) => void;
  clearOrderError: () => void;
  requestBill: () => void;
  processPayment: () => void;
  completePayment: () => void;
  resetSession: () => void;
  setDemoMode: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    session: null,
    cart: [],
    tableNumber: null,
    demoMode: true,
    orderError: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get("table");
    if (table) {
      const existing = sessionStore.loadSession(table);
      if (existing) {
        setState((s) => ({ ...s, session: existing, tableNumber: table, cart: cartStore.loadCart() }));
      } else {
        const session = sessionStore.createSession(table);
        setState((s) => ({ ...s, session, tableNumber: table, cart: cartStore.loadCart() }));
      }
    }
  }, []);

  const initSession = useCallback((tableNumber: string) => {
    const existing = sessionStore.loadSession(tableNumber);
    if (existing) {
      setState((s) => ({ ...s, session: existing, tableNumber, cart: cartStore.loadCart() }));
    } else {
      const session = sessionStore.createSession(tableNumber);
      setState((s) => ({ ...s, session, tableNumber, cart: cartStore.loadCart() }));
    }
  }, []);

  const addItemToCart = useCallback(
    (menuItem: import("@/types").MenuItem, quantity: number, customizations: Customization[], instructions: string) => {
      setState((s) => ({
        ...s,
        cart: cartStore.addToCart(s.cart, menuItem, quantity, customizations, instructions),
      }));
    },
    []
  );

  const updateCartItemQty = useCallback((itemId: string, quantity: number) => {
    setState((s) => ({
      ...s,
      cart: cartStore.updateCartItemQuantity(s.cart, itemId, quantity),
    }));
  }, []);

  const removeCartItem = useCallback((itemId: string) => {
    setState((s) => ({
      ...s,
      cart: cartStore.removeFromCart(s.cart, itemId),
    }));
  }, []);

  const emptyCart = useCallback(() => {
    cartStore.clearCart();
    setState((s) => ({ ...s, cart: [] }));
  }, []);

  const placeOrder = useCallback(async (): Promise<DiningSession | null> => {
    const currentSession = state.session;
    const currentCart = state.cart;
    if (!currentSession || currentCart.length === 0) return null;

    try {
      const order = await submitOrder({
        sessionId: currentSession.id,
        sessionIdentifier: currentSession.sessionIdentifier,
        tableNumber: currentSession.tableNumber,
        notes: "",
        items: currentCart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          customizations: item.customizations.map((customization) => ({
            modifierId: customization.modifierId,
            optionIds: customization.optionIds,
          })),
        })),
      });

      const updated = sessionStore.addOrderToSession(currentSession, order);
      cartStore.clearCart();
      setState((s) => ({ ...s, session: updated, cart: [], orderError: null }));
      return updated;
    } catch (error) {
      setState((s) => ({
        ...s,
        orderError:
          error instanceof Error
            ? error.message
            : "We couldn't place your order. Please try again.",
      }));
      return null;
    }
  }, [state.session, state.cart]);

  const advanceOrderStatus = useCallback(
    async (orderId: string) => {
      const currentSession = state.session;
      if (!currentSession) return;

      const order = currentSession.orders.find((o) => o.id === orderId);
      if (!order) return;

      const flow: OrderStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"];
      const idx = flow.indexOf(order.status);
      if (idx < 0 || idx >= flow.length - 1) return;

      try {
        const serverOrder = await patchOrderStatus(orderId, flow[idx + 1]);
        setState((s) => {
          if (!s.session) return s;
          return { ...s, session: sessionStore.applyServerOrder(s.session, serverOrder), orderError: null };
        });
      } catch (error) {
        setState((s) => ({
          ...s,
          orderError:
            error instanceof Error
              ? error.message
              : "We couldn't update the order status.",
        }));
      }
    },
    [state.session]
  );

  const syncOrders = useCallback((orders: Order[]) => {
    if (orders.length === 0) return;
    setState((s) => {
      if (!s.session) return s;
      return { ...s, session: sessionStore.mergeOrdersFromServer(s.session, orders) };
    });
  }, []);

  const clearOrderError = useCallback(() => {
    setState((s) => (s.orderError === null ? s : { ...s, orderError: null }));
  }, []);

  const requestBill = useCallback(() => {
    if (!state.session) return;
    const updated = sessionStore.updateSessionStatus(state.session, "BILL_REQUESTED");
    setState((s) => ({ ...s, session: updated }));
  }, [state.session]);

  const processPayment = useCallback(() => {
    if (!state.session) return;
    const updated = sessionStore.updateSessionStatus(state.session, "PAYMENT_PENDING");
    setState((s) => ({ ...s, session: updated }));
  }, [state.session]);

  const completePayment = useCallback(() => {
    if (!state.session) return;
    const updated = sessionStore.updateSessionStatus(state.session, "COMPLETED");
    setState((s) => ({ ...s, session: updated }));
  }, [state.session]);

  const resetSession = useCallback(() => {
    sessionStore.clearSession();
    cartStore.clearCart();
    setState({ session: null, cart: [], tableNumber: null, demoMode: true, orderError: null });
  }, []);

  const setDemoMode = useCallback((v: boolean) => {
    setState((s) => ({ ...s, demoMode: v }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        initSession,
        addItemToCart,
        updateCartItemQty,
        removeCartItem,
        emptyCart,
        placeOrder,
        advanceOrderStatus,
        syncOrders,
        clearOrderError,
        requestBill,
        processPayment,
        completePayment,
        resetSession,
        setDemoMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
