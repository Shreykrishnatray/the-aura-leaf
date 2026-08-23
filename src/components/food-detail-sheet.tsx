"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Minus, Plus, Flame, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/providers/app-provider";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";
import type { MenuItem, Customization } from "@/types";

interface Props {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

export function FoodDetailSheet({ item, open, onClose }: Props) {
  const { addItemToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const [selectedMods, setSelectedMods] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setInstructions("");
      setSelectedMods({});
    }
  }, [open, item]);

  if (!item) return null;

  const toggleMod = (modId: string, optionId: string, type: "single" | "multiple") => {
    setSelectedMods((prev) => {
      const current = prev[modId] || [];
      if (type === "single") {
        return { ...prev, [modId]: [optionId] };
      }
      const exists = current.includes(optionId);
      return {
        ...prev,
        [modId]: exists ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  };

  const customizationPrice = item.modifiers.reduce((sum, mod) => {
    const selected = selectedMods[mod.id] || [];
    return sum + mod.options.filter((o) => selected.includes(o.id)).reduce((s, o) => s + o.price, 0);
  }, 0);

  const customizations: Customization[] = item.modifiers
    .filter((mod) => (selectedMods[mod.id] || []).length > 0)
    .map((mod) => {
      const selectedOptions = mod.options.filter((o) => (selectedMods[mod.id] || []).includes(o.id));
      return {
        modifierId: mod.id,
        modifierName: mod.name,
        optionIds: selectedOptions.map((o) => o.id),
        optionNames: selectedOptions.map((o) => o.name),
        price: selectedOptions.reduce((s, o) => s + o.price, 0),
      };
    });

  const handleAdd = () => {
    addItemToCart(item, quantity, customizations, instructions);
    onClose();
  };

  const spiceIcons = Array.from({ length: item.spicyLevel }, (_, i) => (
    <Flame key={i} className="h-3 w-3 text-destructive fill-destructive" />
  ));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] overflow-y-auto rounded-t-3xl bg-card shadow-2xl sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:max-w-lg sm:w-full"
          >
            <div className="relative">
              <div className="relative h-64 w-full overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 512px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <button
                  onClick={onClose}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-charcoal shadow-md backdrop-blur-sm transition-colors hover:bg-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-1">
                    {item.dietary === "vegetarian" || item.dietary === "vegan" ? (
                      <Badge variant="soft" className="bg-green-100 text-green-800 border-green-200">
                        <Leaf className="h-3 w-3 mr-1" />
                        {item.dietary === "vegan" ? "Vegan" : "Veg"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        Non-Veg
                      </Badge>
                    )}
                    {item.isPopular && <Badge className="bg-gold text-forest-dark">Popular</Badge>}
                    {item.isFeatured && <Badge className="bg-forest text-white">Chef&apos;s Special</Badge>}
                  </div>
                </div>
              </div>

              <div className="p-5 pb-28 sm:pb-6">
                <h2 className="font-display text-2xl font-medium text-charcoal mb-1">{item.name}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.description}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  {item.spicyLevel > 0 && (
                    <span className="flex items-center gap-1">
                      {spiceIcons}
                      <span className="ml-1 text-xs">Spice</span>
                    </span>
                  )}
                  <span>{item.preparationTime} min</span>
                  <span>Serves {item.servings}</span>
                </div>

                {item.allergens.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-4">
                    <span className="font-medium">Allergens:</span> {item.allergens.join(", ")}
                  </p>
                )}

                <Separator className="mb-4" />

                {item.modifiers.map((mod) => (
                  <div key={mod.id} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-display text-base font-medium">{mod.name}</h4>
                      {mod.required && (
                        <span className="text-xs text-destructive font-medium">Required</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mod.options.map((opt) => {
                        const selected = (selectedMods[mod.id] || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleMod(mod.id, opt.id, mod.type)}
                            className={`rounded-full px-3 py-1.5 text-sm border transition-all ${
                              selected
                                ? "border-forest bg-forest text-white"
                                : "border-stone bg-card text-charcoal hover:border-forest/50"
                            }`}
                          >
                            {opt.name}
                            {opt.price > 0 && (
                              <span className="ml-1 text-xs opacity-80">+₹{opt.price}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {item.modifiers.length > 0 && <Separator className="mb-4" />}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-charcoal mb-1.5">
                    Special Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Any allergies or preferences..."
                    className="w-full rounded-lg border border-stone bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-muted-foreground focus:border-forest focus:ring-2 focus:ring-forest/20 resize-none"
                    rows={2}
                  />
                </div>
              </div>

              <div className="fixed bottom-0 inset-x-0 p-4 bg-card border-t border-stone sm:relative sm:p-0 sm:mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-stone bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-stone/40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-stone/40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button onClick={handleAdd} className="flex-1 h-12 text-base" size="lg">
                    Add to Cart — {formatCurrency((item.price + customizationPrice) * quantity, RESTAURANT.currency)}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
