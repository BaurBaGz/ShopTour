"use client";

// Избранное хранится в браузере (localStorage) — покупателям не нужен аккаунт.
import { useCallback } from "react";
import { createLocalListStore } from "@/lib/local-list-store";

const store = createLocalListStore("shoptour:favorites");

/** Список id избранных товаров (новые — первыми). На сервере — пустой. */
export const useFavoriteIds = store.useIds;

export function useFavorite(productId: string) {
  const ids = useFavoriteIds();
  const isFavorite = ids.includes(productId);

  const toggle = useCallback(() => {
    const current = store.get();
    store.set(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [productId, ...current],
    );
  }, [productId]);

  return { isFavorite, toggle };
}

/** Убрать из избранного товары, которых больше нет в каталоге */
export function pruneFavorites(existingIds: Set<string>) {
  const current = store.get();
  const kept = current.filter((id) => existingIds.has(id));
  if (kept.length !== current.length) store.set(kept);
}
