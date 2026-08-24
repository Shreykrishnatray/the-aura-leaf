"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, Leaf, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";
import { APP_NAME } from "@/config/constants";

export default function SuccessPage() {
  const router = useRouter();
  const { session, resetSession, completePayment, tableNumber } = useApp();
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (session?.status === "PAYMENT_PENDING" && !hasCompleted.current) {
      hasCompleted.current = true;
      completePayment();
    }
  }, [session?.status, completePayment]);

  const total = session
    ? session.orders.reduce((sum, o) => sum + o.total, 0)
    : 0;

  const handleDone = () => {
    resetSession();
    router.push("/");
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-medium text-charcoal mb-2">No Active Session</h1>
          <p className="text-sm text-muted-foreground mb-6">Start a new dining experience from the menu.</p>
          <Button onClick={() => router.push("/")} size="lg">
            Go to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest"
        >
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-display text-3xl font-medium text-charcoal mb-2">
            Payment Successful
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for dining with {APP_NAME}.
          </p>
        </motion.div>

        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-stone bg-white p-5 mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf className="h-5 w-5 text-forest" />
              <span className="font-display text-lg font-medium text-charcoal">{APP_NAME}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Table</span>
                <span className="font-medium">{session.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session</span>
                <span className="font-medium">{session.sessionIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span className="font-medium">{session.orders.length}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-display text-base font-semibold">
                <span>Total Paid</span>
                <span>{formatCurrency(total, RESTAURANT.currency)}</span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Button onClick={handleDone} className="w-full" size="lg">
            Done
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground">
            We hope to see you again soon.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
