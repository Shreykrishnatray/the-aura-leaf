"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ShoppingBag, ClipboardList, Receipt, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";

const NAV_ITEMS = [
  { href: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { href: "/cart", icon: ShoppingBag, label: "Cart" },
  { href: "/orders", icon: ClipboardList, label: "Orders" },
  { href: "/bill", icon: Receipt, label: "Bill" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { cart, session, tableNumber } = useApp();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-stone bg-white/95 backdrop-blur-md pb-safe sm:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((nav) => {
          const isActive = pathname === nav.href || (nav.href === "/menu" && pathname === "/");
          return (
            <Link
              key={nav.href}
              href={tableNumber ? `${nav.href}?table=${tableNumber}` : nav.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors",
                isActive ? "text-forest" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <nav.icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
                {nav.label === "Cart" && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-forest-dark">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{nav.label}</span>
            </Link>
          );
        })}
        {session && (
          <Link
            href={`/menu?table=${session.tableNumber}`}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-muted-foreground"
          >
            <MapPin className="h-5 w-5" strokeWidth={1.8} />
            <span className="text-[10px] font-medium">T{session.tableNumber}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
