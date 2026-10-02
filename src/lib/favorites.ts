"use client";

// Избранное хранится в браузере (localStorage) — покупателям не нужен аккаунт.
import { useCallback } from "react";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n/client";
import { createLocalListStore } from "@/lib/local-list-store";
import { showToast } from "@/lib/toast";

const store = createLocalListStore("shoptour:favorites");

/** Сам список — для синхронизации с аккаунтом */
export const favoritesList = store;

/** Список id избранных товаров (новые — первыми). На сервере — пустой. */
export const useFavoriteIds = store.useIds;

export function useFavorite(productId: string) {
  const ids = useFavoriteIds();
  const isFavorite = ids.includes(productId);
  const t = useT();

  const toggle = useCallback(() => {
    const current = store.get();
    if (current.includes(productId)) {
      store.set(current.filter((id) => id !== productId));
      showToast({
        message: t.favorites.removedToast,
        // Случайное нажатие легко отменить — возвращаем только этот товар, на прежнее место
        action: {
          label: t.favorites.undo,
          onClick: () => {
            const now = store.get();
            if (now.includes(productId)) return;
            const index = Math.min(current.indexOf(productId), now.length);
            store.set([...now.slice(0, index), productId, ...now.slice(index)]);
          },
        },
      });
    } else {
      store.set([productId, ...current]);
      track({ type: "favorite_add", productId });
      showToast({
        message: t.favorites.addedToast,
        action: { label: t.favorites.view, href: "/favorites" },
      });
    }
  }, [productId, t]);

  return { isFavorite, toggle };
}

/** Убрать из избранного товары, которых больше нет в каталоге */
export function pruneFavorites(existingIds: Set<string>) {
  const current = store.get();
  const kept = current.filter((id) => existingIds.has(id));
  if (kept.length !== current.length) store.set(kept);
}
