"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { APP_NAME } from "@/config/constants";

const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
  { href: "/orders", label: "Orders" },
  { href: "/bill", label: "Bill" },
];

export function HeaderNav() {
  const pathname = usePathname();
  const { cart, tableNumber } = useApp();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 hidden border-b border-stone bg-white/90 backdrop-blur-md sm:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href={tableNumber ? `/menu?table=${tableNumber}` : "/menu"} className="flex items-center gap-2.5">
          <Leaf className="h-6 w-6 text-forest" strokeWidth={1.8} />
          <span className="font-display text-xl font-medium tracking-tight text-charcoal">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((nav) => {
            const isActive = pathname === nav.href || (nav.href === "/menu" && pathname === "/");
            return (
              <Link
                key={nav.href}
                href={tableNumber ? `${nav.href}?table=${tableNumber}` : nav.href}
                className={cn(
                  "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-forest/10 text-forest" : "text-charcoal hover:bg-stone/40"
                )}
              >
                {nav.label}
                {nav.label === "Cart" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-forest-dark">
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
