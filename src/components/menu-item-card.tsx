"use client";

import React from "react";
import Image from "next/image";
import { Flame, Leaf, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESTAURANT } from "@/data/restaurant";
import { formatCurrency } from "@/lib/format";
import type { MenuItem } from "@/types";

interface Props {
  item: MenuItem;
  onClick: () => void;
}

export function MenuItemCard({ item, onClick }: Props) {
  const spiceDots = Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        i < item.spicyLevel ? "bg-destructive" : "bg-stone"
      )}
    />
  ));

  return (
    <button
      onClick={onClick}
      className="group flex w-full text-left gap-4 rounded-xl border border-stone/80 bg-white p-3.5 transition-all duration-200 hover:shadow-md hover:border-sage/60 active:scale-[0.98]"
      disabled={!item.available}
    >
      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-stone/20">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
        />
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white">
            Unavailable
          </div>
        )}
        {item.isPopular && (
          <div className="absolute top-1.5 left-1.5">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold text-forest-dark" aria-label="Popular dish">
              <Star className="h-2.5 w-2.5 fill-current" />
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between min-w-0 py-0.5">
        <div>
          <div className="flex items-start gap-2">
            <h3 className="font-display text-base font-medium text-charcoal leading-tight truncate">
              {item.name}
            </h3>
            <span className="flex-shrink-0 mt-0.5">
              {item.dietary === "vegetarian" || item.dietary === "vegan" ? (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-green-600">
                  <Leaf className="h-2.5 w-2.5 text-green-600" />
                </span>
              ) : (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                </span>
              )}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-display text-base font-semibold text-charcoal">
            {formatCurrency(item.price, RESTAURANT.currency)}
          </span>
          <div className="flex items-center gap-1.5">
            {item.spicyLevel > 0 && (
              <div className="flex items-center gap-0.5">{spiceDots}</div>
            )}
            <span className="text-[10px] text-muted-foreground">{item.preparationTime}m</span>
          </div>
        </div>
      </div>
    </button>
  );
}
