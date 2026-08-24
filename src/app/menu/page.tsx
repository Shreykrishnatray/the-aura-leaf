"use client";

import React, { Suspense, useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Search, X, Leaf, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import { CATEGORIES } from "@/data/categories";
import { MENU_ITEMS, FEATURED_ITEMS } from "@/data/menu";
import { MenuItemCard } from "@/components/menu-item-card";
import { FoodDetailSheet } from "@/components/food-detail-sheet";
import { FloatingCart } from "@/components/floating-cart";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderNav } from "@/components/header-nav";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import type { MenuItem } from "@/types";

function MenuContent() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table");
  const { initSession, session, tableNumber } = useApp();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (table) initSession(table);
  }, [table, initSession]);

  const filteredItems = useMemo(() => {
    let items = MENU_ITEMS as readonly MenuItem[];
    if (activeCategory) {
      items = items.filter((i) => i.categoryId === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeCategory, search]);

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId === activeCategory ? null : catId);
    setSearch("");
    setTimeout(() => {
      categoryRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const openDetail = (item: MenuItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const displayTable = tableNumber || table || "12";

  return (
    <div className="min-h-screen bg-cream">
      <HeaderNav />

      {/* Hero / Header — Full-bleed cinematic food hero */}
      <section className="relative h-[380px] sm:h-[460px] md:h-[520px] lg:h-[600px] overflow-hidden">
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-pizza.jpg"
            alt="Premium artisan vegetable pizza at The Aura Leaf"
            fill
            className="object-cover object-center sm:object-right"
            sizes="100vw"
            priority
          />
        </div>

        {/* Cinematic gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />

        {/* Text content overlay */}
        <div className="relative h-full flex flex-col justify-center z-20 px-6 sm:px-8 md:px-12 lg:pl-16">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="h-4 w-4 text-sage" strokeWidth={1.8} />
              <span className="text-[11px] uppercase tracking-[0.25em] text-sage font-medium">Digital Dining</span>
            </div>
            <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[3.5rem] font-medium tracking-tight leading-[1.05] mb-3 text-cream">
              {APP_NAME}
            </h1>
            <p className="font-display text-lg sm:text-xl lg:text-2xl text-gold italic mb-5">{APP_TAGLINE}</p>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <Badge variant="secondary" className="bg-white/10 text-cream border-white/15 text-sm px-3 py-1">
                Table {displayTable}
              </Badge>
              {session && (
                <Badge variant="secondary" className="bg-forest/30 text-sage border-forest/30 text-xs">
                  Session {session.sessionIdentifier}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-sage/80">
              <MapPin className="h-3.5 w-3.5" />
              <span>You&apos;re dining with us</span>
            </div>
          </div>
        </div>

        {/* Bottom curved transition to cream background */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-cream rounded-t-[2rem] z-30" />
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Search */}
        <div className="relative mt-2 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) setActiveCategory(null);
              }}
              className="w-full rounded-xl border border-stone bg-white py-3 pl-10 pr-10 text-sm text-charcoal placeholder:text-muted-foreground focus:border-forest focus:ring-2 focus:ring-forest/20 shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-charcoal hover:bg-stone/40 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Featured Section */}
        {!search && !activeCategory && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-medium text-charcoal">Chef&apos;s Specials</h2>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Curated</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {FEATURED_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="flex-shrink-0 w-40 rounded-xl border border-stone bg-white p-2 text-left transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className="relative h-28 w-full overflow-hidden rounded-lg bg-stone/20 mb-2">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                      ₹{item.price}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-medium text-charcoal truncate">{item.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Category Navigation */}
        <section className="mb-6 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => {
                setActiveCategory(null);
                setSearch("");
              }}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-all",
                !activeCategory
                  ? "bg-forest text-white border-forest"
                  : "bg-white text-charcoal border-stone hover:border-forest/50"
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={cn(
                  "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition-all whitespace-nowrap",
                  activeCategory === cat.id
                    ? "bg-forest text-white border-forest"
                    : "bg-white text-charcoal border-stone hover:border-forest/50"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Menu Items */}
        <section className="pb-32">
          {search ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"} for &ldquo;{search}&rdquo;
              </p>
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} onClick={() => openDetail(item)} />
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="py-16 text-center">
                  <p className="font-display text-lg text-muted-foreground">No dishes found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          ) : activeCategory ? (
            <div ref={(el) => { categoryRefs.current[activeCategory] = el; }}>
              <div className="mb-4">
                <h2 className="font-display text-xl font-medium text-charcoal">{activeCat?.name}</h2>
                <p className="text-sm text-muted-foreground">{activeCat?.description}</p>
              </div>
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} onClick={() => openDetail(item)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {CATEGORIES.map((cat) => {
                const items = (MENU_ITEMS as readonly MenuItem[]).filter((i) => i.categoryId === cat.id);
                if (items.length === 0) return null;
                return (
                  <div key={cat.id} ref={(el) => { categoryRefs.current[cat.id] = el; }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="font-display text-xl font-medium text-charcoal">{cat.name}</h2>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </div>
                      <button
                        onClick={() => scrollToCategory(cat.id)}
                        className="flex items-center gap-1 text-xs text-forest font-medium hover:underline"
                      >
                        View all <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <MenuItemCard key={item.id} item={item} onClick={() => openDetail(item)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <FloatingCart />
      <MobileNav />
      <FoodDetailSheet item={selectedItem} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-forest border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
