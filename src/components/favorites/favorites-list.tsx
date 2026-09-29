"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { BuildTourButton } from "@/components/favorites/build-tour-button";
import { PRODUCT_SELECT } from "@/lib/data/selects";
import type { ProductWithRelations } from "@/lib/data/types";
import { pruneFavorites, useFavoriteIds } from "@/lib/favorites";
import { createClient } from "@/lib/supabase/client";
import { formatProductCount } from "@/lib/utils/format";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; products: ProductWithRelations[] };

export function FavoritesList() {
  const ids = useFavoriteIds();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // Товары подгружаем, когда появляются новые id; удалённые просто скрываем из списка
  const idsKey = [...ids].sort().join(",");

  useEffect(() => {
    if (!idsKey) {
      setState({ status: "ready", products: [] });
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .in("id", idsKey.split(","))
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[favorites] load:", error.message);
          setState({ status: "error" });
          return;
        }
        const products = (data as ProductWithRelations[]) ?? [];
        pruneFavorites(new Set(products.map((p) => p.id)));
        setState({ status: "ready", products });
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (state.status === "loading" && ids.length > 0) {
    return <p className="text-sm text-stone-500">Загружаем избранное…</p>;
  }

  if (state.status === "error") {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
        Не удалось загрузить избранное. Обновите страницу.
      </p>
    );
  }

  // Порядок как в избранном: последние добавленные — первыми
  const byId = new Map(
    (state.status === "ready" ? state.products : []).map((p) => [p.id, p]),
  );
  const products = ids
    .map((id) => byId.get(id))
    .filter((p): p is ProductWithRelations => Boolean(p));

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
        <p className="text-lg font-medium text-stone-800">В избранном пока пусто</p>
        <p className="mt-2 max-w-sm text-sm text-stone-500">
          Нажмите на сердечко на карточке товара, чтобы сохранить его здесь.
        </p>
        <Link
          href="/catalog"
          className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">{formatProductCount(products.length)}</p>
        <BuildTourButton storeIds={products.map((p) => p.store_id)} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
