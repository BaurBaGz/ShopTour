"use client";

// Избранное хранится в браузере (localStorage) — покупателям не нужен аккаунт.
import { useCallback } from "react";
import { createLocalListStore } from "@/lib/local-list-store";
import { showToast } from "@/lib/toast";

const store = createLocalListStore("shoptour:favorites");

/** Список id избранных товаров (новые — первыми). На сервере — пустой. */
export const useFavoriteIds = store.useIds;

export function useFavorite(productId: string) {
  const ids = useFavoriteIds();
  const isFavorite = ids.includes(productId);

  const toggle = useCallback(() => {
    const current = store.get();
    if (current.includes(productId)) {
      store.set(current.filter((id) => id !== productId));
      showToast({
        message: "Удалено из избранного",
        // Случайное нажатие легко отменить — возвращаем только этот товар, на прежнее место
        action: {
          label: "Вернуть",
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
      showToast({
        message: "Добавлено в избранное",
        action: { label: "Смотреть", href: "/favorites" },
      });
    }
  }, [productId]);

  return { isFavorite, toggle };
}

/** Убрать из избранного товары, которых больше нет в каталоге */
export function pruneFavorites(existingIds: Set<string>) {
  const current = store.get();
  const kept = current.filter((id) => existingIds.has(id));
  if (kept.length !== current.length) store.set(kept);
}
