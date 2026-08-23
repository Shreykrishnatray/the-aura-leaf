"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { DiningSession, OrderStatus, SessionStatus, OrderItem, Customization } from "@/types";
import type { CartItem } from "@/lib/cart-store";
import * as sessionStore from "@/lib/session-store";
import * as cartStore from "@/lib/cart-store";

interface AppState {
  session: DiningSession | null;
  cart: CartItem[];
  tableNumber: string | null;
  demoMode: boolean;
}

interface AppContextValue extends AppState {
  initSession: (tableNumber: string) => void;
  addItemToCart: (menuItem: import("@/types").MenuItem, quantity: number, customizations: Customization[], instructions: string) => void;
  updateCartItemQty: (itemId: string, quantity: number) => void;
  removeCartItem: (itemId: string) => void;
  emptyCart: () => void;
  placeOrder: () => DiningSession | null;
  advanceOrderStatus: (orderId: string) => void;
  requestBill: () => void;
  processPayment: () => void;
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

  const placeOrder = useCallback((): DiningSession | null => {
    if (!state.session || state.cart.length === 0) return null;
    const orderItems = cartStore.cartToOrderItems(state.cart);
    const updated = sessionStore.addOrderToSession(state.session, orderItems);
    cartStore.clearCart();
    setState((s) => ({ ...s, session: updated, cart: [] }));
    return updated;
  }, [state.session, state.cart]);

  const advanceOrderStatus = useCallback(
    (orderId: string) => {
      if (!state.session) return;
      const order = state.session.orders.find((o) => o.id === orderId);
      if (!order) return;
      const flow: OrderStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"];
      const idx = flow.indexOf(order.status);
      if (idx < 0 || idx >= flow.length - 1) return;
      const next = flow[idx + 1];
      const updated = sessionStore.updateOrderStatus(state.session, orderId, next);
      setState((s) => ({ ...s, session: updated }));
    },
    [state.session]
  );

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

  const resetSession = useCallback(() => {
    sessionStore.clearSession();
    cartStore.clearCart();
    setState({ session: null, cart: [], tableNumber: null, demoMode: true });
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
        requestBill,
        processPayment,
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
