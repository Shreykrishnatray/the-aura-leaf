"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Smartphone, Banknote, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderNav } from "@/components/header-nav";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone, description: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, description: "Credit or Debit Card" },
  { id: "cash", label: "Cash", icon: Banknote, description: "Pay at the counter" },
] as const;

export default function PaymentPage() {
  const router = useRouter();
  const { session, processPayment, tableNumber } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!session || session.orders.length === 0) {
      router.replace(tableNumber ? `/menu?table=${tableNumber}` : "/menu");
    }
  }, [session, router, tableNumber]);

  if (!session || session.orders.length === 0) {
    return null;
  }

  const total = session.orders.reduce((sum, o) => sum + o.total, 0);

  const handlePay = async () => {
    if (!selectedMethod) return;
    setProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    processPayment();
    router.push(`/success?table=${session.tableNumber}`);
  };

  return (
    <div className="min-h-screen bg-cream">
      <HeaderNav />
      <div className="mx-auto max-w-lg px-4 sm:px-6 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(tableNumber ? `/bill?table=${tableNumber}` : "/bill")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone/40 transition-colors"
            aria-label="Back to bill"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-medium text-charcoal">Payment</h1>
            <p className="text-sm text-muted-foreground">Demo / Mock Payment</p>
          </div>
        </div>

        {/* Demo Banner */}
        <div className="mb-6 rounded-xl bg-info/10 border border-info/20 p-3">
          <p className="text-xs text-info font-medium">
            This is a demo payment. No real payment will be processed.
          </p>
        </div>

        {/* Amount */}
        <div className="rounded-xl border border-stone bg-white p-5 mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
          <p className="font-display text-3xl font-semibold text-charcoal">
            {formatCurrency(total, RESTAURANT.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Table {session.tableNumber} · {session.sessionIdentifier}
          </p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          <h3 className="font-display text-base font-medium text-charcoal">Select Payment Method</h3>
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const selected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  selected
                    ? "border-forest bg-forest/5 ring-1 ring-forest/20"
                    : "border-stone bg-white hover:border-sage/60"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    selected ? "bg-forest text-white" : "bg-stone/30 text-charcoal"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-charcoal">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                {selected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-forest">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button
          onClick={handlePay}
          disabled={!selectedMethod || processing}
          className="w-full h-12 text-base"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              Pay {formatCurrency(total, RESTAURANT.currency)}
            </>
          )}
        </Button>
      </div>
      <MobileNav />
    </div>
  );
}
