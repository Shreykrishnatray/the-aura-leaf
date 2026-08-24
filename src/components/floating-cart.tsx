"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";

export function FloatingCart() {
  const { cart, tableNumber } = useApp();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const cartHref = tableNumber ? `/cart?table=${tableNumber}` : "/cart";

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-20 inset-x-0 z-40 px-4 pb-safe sm:bottom-6"
        >
          <Link
            href={cartHref}
            className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-forest px-5 py-3.5 text-white shadow-xl transition-all hover:bg-forest-dark active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-forest-dark">
                  {itemCount}
                </span>
              </div>
              <span className="text-sm font-medium">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-semibold">{formatCurrency(total, RESTAURANT.currency)}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">View Cart</span>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
