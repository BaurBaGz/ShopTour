"use client";

import { localizeProductCategory } from "@/lib/i18n/categories";
import { useLocale, useT } from "@/lib/i18n/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { PRODUCT_SELECT } from "@/lib/data/selects";
import type { ProductWithRelations } from "@/lib/data/types";
import { pruneRecent, recentList, useRecentIds } from "@/lib/recent";
import { createClient } from "@/lib/supabase/client";

type RecentProductsProps = {
  /** Сколько товаров показать (по умолчанию все) */
  limit?: number;
  title?: string;
};

/** «Недавно смотрели» — товары из истории просмотров, последние первыми */
export function RecentProducts({ limit, title: customTitle }: RecentProductsProps) {
  const t = useT();
  const locale = useLocale();
  const title = customTitle ?? t.favoritesPage.recentTitle;
  const allIds = useRecentIds();
  const ids = limit ? allIds.slice(0, limit) : allIds;
  const idsKey = ids.join(",");
  const [products, setProducts] = useState<Map<string, ProductWithRelations> | null>(null);

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    createClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", idsKey.split(","))
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[recent] load:", error.message);
          return;
        }
        const list = (data as ProductWithRelations[]) ?? [];
        // Удалённые из каталога товары убираем из истории (только при полном списке)
        if (!limit) pruneRecent(new Set(list.map((p) => p.id)));
        setProducts(new Map(list.map((p) => [p.id, p])));
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey, limit]);

  const visible = products
    ? ids
        .map((id) => products.get(id))
        .filter((p): p is ProductWithRelations => Boolean(p))
        .map((p) => localizeProductCategory(p, locale))
    : [];

  if (ids.length === 0 || (products && visible.length === 0)) {
    return (
      <section aria-label={title}>
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">{title}</h2>
        <p className="mt-2 text-sm text-stone-500">
          {t.favoritesPage.recentEmpty} <Link href="/catalog" className="font-medium text-rose-600 hover:text-rose-700">{t.favoritesPage.recentToCatalog}</Link>
        </p>
      </section>
    );
  }

  return (
    <section aria-label={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-stone-900">{title}</h2>
        <button
          type="button"
          onClick={() => recentList.set([])}
          className="inline-flex min-h-11 items-center text-sm font-medium text-stone-500 hover:text-stone-900"
        >
          {t.favoritesPage.clearHistory}
        </button>
      </div>
      {!products ? (
        <p className="mt-2 text-sm text-stone-500">{t.favoritesPage.loadingShort}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
