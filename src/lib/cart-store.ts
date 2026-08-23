"use client";

import type { MenuItem, OrderItem, Customization } from "@/types";
import { STORAGE_KEYS } from "@/config/constants";
import { RESTAURANT } from "@/data/restaurant";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  customizations: Customization[];
  specialInstructions: string;
}

function generateCartId(): string {
  return `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
}

export function addToCart(
  existingItems: CartItem[],
  menuItem: MenuItem,
  quantity: number,
  customizations: Customization[],
  specialInstructions: string
): CartItem[] {
  const customizationPrice = customizations.reduce((sum, c) => sum + c.price, 0);
  const newItem: CartItem = {
    id: generateCartId(),
    menuItemId: menuItem.id,
    name: menuItem.name,
    image: menuItem.image,
    price: menuItem.price + customizationPrice,
    quantity,
    customizations,
    specialInstructions,
  };
  const updated = [...existingItems, newItem];
  saveCart(updated);
  return updated;
}

export function updateCartItemQuantity(items: CartItem[], itemId: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(items, itemId);
  }
  const updated = items.map((item) =>
    item.id === itemId ? { ...item, quantity } : item
  );
  saveCart(updated);
  return updated;
}

export function removeFromCart(items: CartItem[], itemId: string): CartItem[] {
  const updated = items.filter((item) => item.id !== itemId);
  saveCart(updated);
  return updated;
}

export function clearCart(): void {
  saveCart([]);
}

export function cartToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    id: generateCartId(),
    menuItemId: item.menuItemId,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    customizations: item.customizations,
    specialInstructions: item.specialInstructions,
    total: item.price * item.quantity,
  }));
}

export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = RESTAURANT.taxes.reduce((sum, t) => sum + t.rate, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const serviceCharge = Math.round((subtotal * RESTAURANT.serviceCharge) / 100);
  const total = subtotal + taxAmount + serviceCharge;
  return { subtotal, taxAmount, serviceCharge, total };
}
