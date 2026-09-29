"use client";

// Избранное хранится в браузере (localStorage) — покупателям не нужен аккаунт.
// Все компоненты подписаны на одно хранилище и обновляются вместе, в том числе между вкладками.
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "shoptour:favorites";
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    // Приватный режим или повреждённые данные — начинаем с пустого списка
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Хранилище недоступно — избранное живёт до перезагрузки страницы
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Список id избранных товаров (новые — первыми). На сервере — пустой. */
export function useFavoriteIds(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useFavorite(productId: string) {
  const ids = useFavoriteIds();
  const isFavorite = ids.includes(productId);

  const toggle = useCallback(() => {
    const current = read();
    write(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [productId, ...current],
    );
  }, [productId]);

  return { isFavorite, toggle };
}

/** Убрать из избранного товары, которых больше нет в каталоге */
export function pruneFavorites(existingIds: Set<string>) {
  const current = read();
  const kept = current.filter((id) => existingIds.has(id));
  if (kept.length !== current.length) write(kept);
}
