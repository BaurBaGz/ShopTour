"use client";

// Маршрут — упорядоченный список магазинов для обхода. Хранится в браузере.
import { track } from "@/lib/analytics";
import { createLocalListStore } from "@/lib/local-list-store";

/** Google Карты принимают до 9 промежуточных точек в ссылке — всего 10 остановок */
export const MAX_TOUR_STOPS = 10;

const store = createLocalListStore("shoptour:tour");

/** Сам список — для синхронизации с аккаунтом */
export const tourList = store;

export const useTourIds = store.useIds;

export const tour = {
  add(storeId: string) {
    const current = store.get();
    if (current.includes(storeId) || current.length >= MAX_TOUR_STOPS) return;
    store.set([...current, storeId]);
    // Магазин попал в маршрут — человек собирается к нему зайти
    track({ type: "tour_add", storeId });
  },
  remove(storeId: string) {
    store.set(store.get().filter((id) => id !== storeId));
  },
  /** Сдвинуть остановку на delta позиций (−1 — выше, +1 — ниже) */
  move(storeId: string, delta: number) {
    const current = [...store.get()];
    const from = current.indexOf(storeId);
    const to = from + delta;
    if (from === -1 || to < 0 || to >= current.length) return;
    [current[from], current[to]] = [current[to], current[from]];
    store.set(current);
  },
  replace(storeIds: string[]) {
    const before = store.get();
    const next = [...new Set(storeIds)].slice(0, MAX_TOUR_STOPS);
    store.set(next);
    for (const storeId of next) if (!before.includes(storeId)) track({ type: "tour_add", storeId });
  },
  clear() {
    store.set([]);
  },
};
