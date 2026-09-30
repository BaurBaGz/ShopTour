"use client";

// Недавно просмотренные товары (новые — первыми). Хранятся в браузере, у вошедших — и в аккаунте.
import { createLocalListStore } from "@/lib/local-list-store";

export const MAX_RECENT = 24;

const store = createLocalListStore("shoptour:recent");

/** Сам список — для синхронизации с аккаунтом */
export const recentList = store;

export const useRecentIds = store.useIds;

export function addRecent(productId: string) {
  const current = store.get();
  if (current[0] === productId) return;
  store.set([productId, ...current.filter((id) => id !== productId)].slice(0, MAX_RECENT));
}

/** Убрать товары, которых больше нет в каталоге */
export function pruneRecent(existingIds: Set<string>) {
  const current = store.get();
  const kept = current.filter((id) => existingIds.has(id));
  if (kept.length !== current.length) store.set(kept);
}
