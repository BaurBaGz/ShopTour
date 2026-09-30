"use client";

// Анонимный счётчик для раздела «Аналитика». Посетитель — случайный id в браузере,
// без имени, телефона и cookie. Отправка — sendBeacon: не задерживает переходы по сайту.
import type { AnalyticsEventType } from "@/types/database";

export type TrackEvent = {
  type: AnalyticsEventType;
  productId?: string;
  storeId?: string;
  bannerId?: string;
  query?: string;
  results?: number;
};

const VISITOR_KEY = "shoptour:visitor";
let fallbackVisitorId: string | null = null;

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getVisitorId() {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Хранилище недоступно — считаем посетителя до перезагрузки страницы
    fallbackVisitorId ??= randomId();
    return fallbackVisitorId;
  }
}

// Одно и то же событие чаще раза в 2 секунды не шлём (двойной эффект React, двойной клик)
const recent = new Map<string, number>();

export function track(event: TrackEvent) {
  if (typeof window === "undefined") return;

  const key = JSON.stringify(event) + window.location.pathname;
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < 2000) return;
  recent.set(key, now);

  const payload = JSON.stringify({ ...event, visitorId: getVisitorId(), path: window.location.pathname });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "text/plain" }))) return;
  } catch {
    // пробуем fetch
  }
  fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
}
