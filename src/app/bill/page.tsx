"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt, AlertCircle, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderNav } from "@/components/header-nav";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";

export default function BillPage() {
  const router = useRouter();
  const { session, requestBill, tableNumber } = useApp();
  const [confirming, setConfirming] = useState(false);

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
            <h1 className="font-display text-2xl font-medium text-charcoal">Bill</h1>
          </div>
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone/30">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl text-charcoal mb-1">No orders to bill</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Place an order first to see your bill
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

  const subtotal = session.orders.reduce((sum, o) => sum + o.subtotal, 0);
  const taxAmount = session.orders.reduce((sum, o) => sum + o.taxAmount, 0);
  const serviceCharge = session.orders.reduce((sum, o) => sum + o.serviceCharge, 0);
  const total = session.orders.reduce((sum, o) => sum + o.total, 0);

  const handleRequestBill = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    requestBill();
    router.push(`/payment?table=${session.tableNumber}`);
  };

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
            <h1 className="font-display text-2xl font-medium text-charcoal">Your Bill</h1>
            <p className="text-sm text-muted-foreground">
              Table {session.tableNumber} · {session.sessionIdentifier}
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {session.status === "BILL_REQUESTED" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-gold/10 border border-gold/30 p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gold-deep" />
              <div>
                <p className="text-sm font-medium text-charcoal">Bill Requested</p>
                <p className="text-xs text-muted-foreground">
                  Your server is preparing the final bill. Please proceed to payment.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Orders */}
        <div className="space-y-3 mb-6">
          {session.orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-stone bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm font-medium text-charcoal">Order {order.id}</h3>
                <Badge
                  variant={
                    order.status === "SERVED" ? "success" : order.status === "PREPARING" ? "warning" : "secondary"
                  }
                  className="text-[10px]"
                >
                  {order.status}
                </Badge>
              </div>
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-charcoal">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(item.price * item.quantity, RESTAURANT.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-medium">
                <span>Order Total</span>
                <span className="tabular-nums">{formatCurrency(order.total, RESTAURANT.currency)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="rounded-xl border border-stone bg-white p-4 mb-6">
          <h3 className="font-display text-base font-medium text-charcoal mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({session.orders.length} orders)</span>
              <span className="tabular-nums">{formatCurrency(subtotal, RESTAURANT.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="tabular-nums">{formatCurrency(taxAmount, RESTAURANT.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Charge</span>
              <span className="tabular-nums">{formatCurrency(serviceCharge, RESTAURANT.currency)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-display text-lg font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total, RESTAURANT.currency)}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Payment is made once at the end of your dining experience.
          </p>
        </div>

        {session.status === "ACTIVE" && (
          <Button onClick={handleRequestBill} className="w-full h-12 text-base" size="lg">
            {confirming ? (
              <>
                <CreditCard className="h-5 w-5" />
                Confirm — Request Final Bill
              </>
            ) : (
              <>
                <Receipt className="h-5 w-5" />
                Request Final Bill
              </>
            )}
          </Button>
        )}

        {session.status === "BILL_REQUESTED" && (
          <Button
            onClick={() => router.push(`/payment?table=${session.tableNumber}`)}
            className="w-full h-12 text-base"
            size="lg"
          >
            <CreditCard className="h-5 w-5" />
            Proceed to Payment
          </Button>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
