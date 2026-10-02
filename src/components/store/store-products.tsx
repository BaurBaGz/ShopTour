"use client";

import { useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductWithRelations } from "@/lib/data/types";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

/** Товары витрины с вкладками по категориям — как разделы в профиле магазина */
export function StoreProducts({ products }: { products: ProductWithRelations[] }) {
  const [category, setCategory] = useState<string | null>(null);
  const t = useT();

  const categories = [...new Map(products.filter((p) => p.categories).map((p) => [p.categories!.id, p.categories!.name])).entries()]
    .map(([id, name]) => ({ id, name, count: products.filter((p) => p.categories?.id === id).length }))
    .sort((a, b) => b.count - a.count);
  const visible = category ? products.filter((p) => p.categories?.id === category) : products;

  return (
    <>
      {categories.length > 1 && (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t.store.categoriesLabel}>
          {[{ id: null, name: t.sections.all, count: products.length }, ...categories].map((c) => (
            <button
              key={c.id ?? "all"}
              type="button"
              onClick={() => setCategory(c.id)}
              aria-pressed={category === c.id}
              className={cn(
                "min-h-10 shrink-0 rounded-full px-4 text-sm font-medium transition",
                category === c.id ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
              )}
            >
              {c.name} <span className="opacity-60">{c.count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
