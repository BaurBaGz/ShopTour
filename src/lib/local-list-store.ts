"use client";

// Список id в localStorage с подпиской для React (избранное, Shop Tour).
// Все компоненты обновляются вместе, в том числе между вкладками браузера.
import { useSyncExternalStore } from "react";

const EMPTY: string[] = [];

export type LocalListStore = {
  useIds: () => string[];
  get: () => string[];
  set: (ids: string[]) => void;
};

export function createLocalListStore(storageKey: string): LocalListStore {
  const listeners = new Set<() => void>();
  let cache: string[] | null = null;

  function get(): string[] {
    if (cache) return cache;
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      cache = Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      // Приватный режим или повреждённые данные — начинаем с пустого списка
      cache = [];
    }
    return cache;
  }

  function set(ids: string[]) {
    cache = ids;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {
      // Хранилище недоступно — список живёт до перезагрузки страницы
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  // На сервере список всегда пустой
  const useIds = () => useSyncExternalStore(subscribe, get, () => EMPTY);

  return { useIds, get, set };
}
