"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderNav } from "@/components/header-nav";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";
import { APP_NAME } from "@/config/constants";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateCartItemQty, removeCartItem, placeOrder, tableNumber } = useApp();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = RESTAURANT.taxes.reduce((sum, t) => sum + t.rate, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const serviceCharge = Math.round((subtotal * RESTAURANT.serviceCharge) / 100);
  const total = subtotal + taxAmount + serviceCharge;

  const handlePlaceOrder = () => {
    const session = placeOrder();
    if (session) {
      router.push(`/orders?table=${session.tableNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <HeaderNav />

      <div className="mx-auto max-w-lg px-4 sm:px-6 pt-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(tableNumber ? `/menu?table=${tableNumber}` : "/menu")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone/40 transition-colors"
            aria-label="Back to menu"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-medium text-charcoal">Your Cart</h1>
            <p className="text-sm text-muted-foreground">Review your order before placing</p>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone/30">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl text-charcoal mb-1">Your cart is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Browse the menu and add some delicious dishes
            </p>
            <Button
              onClick={() => router.push(tableNumber ? `/menu?table=${tableNumber}` : "/menu")}
              variant="outline"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 mb-6">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex gap-3 rounded-xl border border-stone bg-white p-3"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone/20">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 justify-between min-w-0">
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-medium text-charcoal truncate">{item.name}</h3>
                        {item.customizations.length > 0 && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {item.customizations.map((c) => c.optionNames.join(", ")).join(" · ")}
                          </p>
                        )}
                        {item.specialInstructions && (
                          <p className="text-[10px] text-muted-foreground italic truncate">
                            &ldquo;{item.specialInstructions}&rdquo;
                          </p>
                        )}
                        <p className="text-sm font-medium text-charcoal mt-1">
                          {formatCurrency(item.price * item.quantity, RESTAURANT.currency)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="flex items-center rounded-full border border-stone">
                          <button
                            onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone/40"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone/40"
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-stone bg-white p-4">
              <h3 className="font-display text-base font-medium text-charcoal mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal, RESTAURANT.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxes ({taxRate}%)</span>
                  <span className="tabular-nums">{formatCurrency(taxAmount, RESTAURANT.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Charge ({RESTAURANT.serviceCharge}%)</span>
                  <span className="tabular-nums">{formatCurrency(serviceCharge, RESTAURANT.currency)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-display text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total, RESTAURANT.currency)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Payment is made once at the end of your dining experience.
              </p>
            </div>

            <Button onClick={handlePlaceOrder} className="w-full h-12 text-base mt-4" size="lg">
              Place Order
            </Button>
          </>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
