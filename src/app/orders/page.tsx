"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderNav } from "@/components/header-nav";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/config/constants";
import type { OrderStatus } from "@/types";

const STATUS_FLOW: OrderStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"];

function OrderStatusTracker({ status }: { status: OrderStatus }) {
  const currentIdx = STATUS_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((s, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isCancelled = status === "CANCELLED";
        return (
          <div key={s} className="flex items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                isCancelled
                  ? "bg-destructive/20 text-destructive"
                  : isDone
                  ? "bg-forest text-white"
                  : isCurrent
                  ? "bg-gold text-forest-dark ring-2 ring-gold/30"
                  : "bg-stone/40 text-muted-foreground"
              )}
            >
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 rounded-full",
                  isDone ? "bg-forest" : "bg-stone/40"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  orderId,
  status,
  items,
  total,
  createdAt,
}: {
  orderId: string;
  status: OrderStatus;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  createdAt: string;
}) {
  const { advanceOrderStatus, demoMode } = useApp();
  const currentIdx = STATUS_FLOW.indexOf(status);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 && status !== "CANCELLED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-stone bg-white p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-base font-medium text-charcoal">Order {orderId}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(createdAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge
          variant={
            status === "SERVED"
              ? "success"
              : status === "PREPARING"
              ? "warning"
              : status === "CANCELLED"
              ? "destructive"
              : "secondary"
          }
        >
          {ORDER_STATUS_LABELS[status]}
        </Badge>
      </div>

      <OrderStatusTracker status={status} />

      <div className="mt-3 space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-charcoal">
              {item.quantity}x {item.name}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatCurrency(item.price * item.quantity, RESTAURANT.currency)}
            </span>
          </div>
        ))}
      </div>

      <Separator className="my-3" />

      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">
          {formatCurrency(total, RESTAURANT.currency)}
        </span>
        {demoMode && canAdvance && (
          <Button
            size="sm"
            variant="soft"
            onClick={() => advanceOrderStatus(orderId)}
            className="text-xs"
          >
            Simulate: {ORDER_STATUS_LABELS[STATUS_FLOW[currentIdx + 1]]}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { session, tableNumber } = useApp();

  if (!session || session.orders.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <HeaderNav />
        <div className="mx-auto max-w-lg px-4 sm:px-6 pt-6 pb-32">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push(tableNumber ? `/menu?table=${tableNumber}` : "/menu")}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone/40 transition-colors"
              aria-label="Back to menu"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-2xl font-medium text-charcoal">Orders</h1>
          </div>
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone/30">
              <ClipboardListIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl text-charcoal mb-1">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Place your first order from the menu
            </p>
            <Button
              onClick={() => router.push(tableNumber ? `/menu?table=${tableNumber}` : "/menu")}
              variant="outline"
            >
              Browse Menu
            </Button>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <HeaderNav />
      <div className="mx-auto max-w-lg px-4 sm:px-6 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(tableNumber ? `/menu?table=${tableNumber}` : "/menu")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone/40 transition-colors"
            aria-label="Back to menu"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-medium text-charcoal">Orders</h1>
            <p className="text-sm text-muted-foreground">
              Table {session.tableNumber} · {session.sessionIdentifier}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6 -mx-4 px-4 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(tableNumber ? `/menu?table=${tableNumber}` : "/menu")}
            className="flex-shrink-0"
          >
            <UtensilsCrossed className="h-4 w-4" />
            Order More
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(tableNumber ? `/bill?table=${tableNumber}` : "/bill")}
            className="flex-shrink-0"
          >
            View Bill
          </Button>
        </div>

        {/* Orders */}
        <div className="space-y-3">
          {[...session.orders].reverse().map((order) => (
            <OrderCard
              key={order.id}
              orderId={order.id}
              status={order.status}
              items={order.items.map((i) => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price,
              }))}
              total={order.total}
              createdAt={order.createdAt}
            />
          ))}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
