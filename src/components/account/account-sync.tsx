"use client";

import { useEffect } from "react";
import { favoritesList } from "@/lib/favorites";
import type { LocalListStore } from "@/lib/local-list-store";
import { MAX_RECENT, recentList } from "@/lib/recent";
import { createClient } from "@/lib/supabase/client";
import { MAX_TOUR_STOPS, tourList } from "@/lib/tour";
import type { UserListKind } from "@/types/database";

// Чей аккаунт уже синхронизирован в этом браузере
const SYNC_USER_KEY = "shoptour:sync-user";

type ListConfig = {
  store: LocalListStore;
  /** Первый вход на устройстве: как объединить сохранённое в браузере с аккаунтом */
  merge: (local: string[], server: string[]) => string[];
};

const union = (first: string[], second: string[]) => [...new Set([...first, ...second])];

const LISTS: Record<UserListKind, ListConfig> = {
  // Всё, что отмечено и там и там; новые из браузера — первыми
  favorites: { store: favoritesList, merge: (local, server) => union(local, server).slice(0, 500) },
  // Маршрут, собранный перед входом, важнее сохранённого раньше
  tour: { store: tourList, merge: (local, server) => (local.length ? local : server).slice(0, MAX_TOUR_STOPS) },
  recent: { store: recentList, merge: (local, server) => union(local, server).slice(0, MAX_RECENT) },
};
const KINDS = Object.keys(LISTS) as UserListKind[];

const same = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

function readSyncUser() {
  try {
    return window.localStorage.getItem(SYNC_USER_KEY);
  } catch {
    return null;
  }
}

function writeSyncUser(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(SYNC_USER_KEY, userId);
    else window.localStorage.removeItem(SYNC_USER_KEY);
  } catch {
    // без хранилища синхронизация работает до перезагрузки
  }
}

/**
 * Держит избранное, маршрут и недавно просмотренные одинаковыми в браузере и в аккаунте.
 * После выхода очищает их в браузере — на чужом компьютере ничего не остаётся.
 */
export function AccountSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    const syncedUser = readSyncUser();

    if (!userId) {
      // Вышли из аккаунта — сохранённое остаётся в аккаунте, а из браузера убираем
      if (syncedUser) {
        KINDS.forEach((kind) => LISTS[kind].store.set([]));
        writeSyncUser(null);
      }
      return;
    }

    const supabase = createClient();
    // Что сейчас лежит в аккаунте — чтобы не отправлять туда то, что только что оттуда получили
    const serverState = new Map<UserListKind, string[]>();
    const timers = new Map<UserListKind, ReturnType<typeof setTimeout>>();
    // Изменения, сделанные до первой загрузки из аккаунта (например, просмотр товара при открытии страницы)
    const dirty = new Set<UserListKind>();
    let ready = false;
    let cancelled = false;

    const push = async (kind: UserListKind) => {
      timers.delete(kind);
      const ids = LISTS[kind].store.get();
      if (same(ids, serverState.get(kind) ?? [])) return;
      serverState.set(kind, ids);
      const { error } = await supabase
        .from("user_lists")
        .upsert({ user_id: userId, kind, ids, updated_at: new Date().toISOString() });
      if (error) console.error("[account] save list:", error.message);
    };

    const schedulePush = (kind: UserListKind) => {
      if (!ready) {
        dirty.add(kind);
        return;
      }
      clearTimeout(timers.get(kind));
      timers.set(kind, setTimeout(() => void push(kind), 600));
    };

    const pull = async (mergeLocal: boolean) => {
      const { data, error } = await supabase.from("user_lists").select("kind, ids").eq("user_id", userId);
      if (cancelled || error) {
        if (error) console.error("[account] load lists:", error.message);
        return;
      }
      const fromServer = new Map((data ?? []).map((row) => [row.kind, row.ids]));
      for (const kind of KINDS) {
        // Изменение ещё не ушло в аккаунт — не перетираем его
        if (timers.has(kind)) continue;
        const server = fromServer.get(kind) ?? [];
        serverState.set(kind, server);
        const { store, merge } = LISTS[kind];
        // Аккаунт главнее, но свежие изменения из этого браузера не теряем
        const next = mergeLocal || dirty.has(kind) ? merge(store.get(), server) : server;
        if (!same(next, store.get())) store.set(next);
        if (!same(next, server)) void push(kind);
      }
    };

    const unsubscribers = KINDS.map((kind) => LISTS[kind].store.subscribe(() => schedulePush(kind)));

    // Первый вход на этом устройстве (или другой аккаунт) — объединяем, иначе аккаунт главнее
    const firstTime = syncedUser !== userId;
    const mergeLocal = firstTime && !syncedUser;
    if (firstTime && syncedUser) KINDS.forEach((kind) => LISTS[kind].store.set([]));
    void pull(mergeLocal).then(() => {
      if (cancelled) return;
      writeSyncUser(userId);
      dirty.clear();
      ready = true;
    });

    // Вернулись на вкладку — подтягиваем изменения с других устройств
    const onVisible = () => {
      if (document.visibilityState === "visible" && ready) void pull(false);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      unsubscribers.forEach((off) => off());
      document.removeEventListener("visibilitychange", onVisible);
      // Не теряем изменение, сделанное прямо перед уходом со страницы
      timers.forEach((timer, kind) => {
        clearTimeout(timer);
        void push(kind);
      });
    };
  }, [userId]);

  return null;
}
