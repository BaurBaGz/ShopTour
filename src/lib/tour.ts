"use client";

// Маршрут — упорядоченный список магазинов для обхода. Хранится в браузере.
import { createLocalListStore } from "@/lib/local-list-store";

/** Google Карты принимают до 9 промежуточных точек в ссылке — всего 10 остановок */
export const MAX_TOUR_STOPS = 10;

const store = createLocalListStore("shoptour:tour");

export const useTourIds = store.useIds;

export const tour = {
  add(storeId: string) {
    const current = store.get();
    if (current.includes(storeId) || current.length >= MAX_TOUR_STOPS) return;
    store.set([...current, storeId]);
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
    store.set([...new Set(storeIds)].slice(0, MAX_TOUR_STOPS));
  },
  clear() {
    store.set([]);
  },
};
