"use client";

// Анонимный счётчик для раздела «Аналитика». Посетитель — случайный id в браузере,
// без имени, телефона и cookie. Отправка — sendBeacon: не задерживает переходы по сайту.
import type { AnalyticsEventType, AnalyticsSource } from "@/types/database";

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

// Первая страница визита: если посетитель сразу попал на магазин или товар — он пришёл по ссылке извне
let entryPath: string | null = null;
let navigated = false;

/** Откуда посетитель попал на текущую страницу: нашёл внутри ShopTour или пришёл по внешней ссылке */
function visitSource(): AnalyticsSource {
  if (navigated) return "shoptour";
  let host = "";
  try {
    host = document.referrer ? new URL(document.referrer).hostname : "";
  } catch {
    host = "";
  }
  if (!host) return "direct";
  if (host === window.location.hostname) return "shoptour";
  // l.instagram.com — переход по ссылке из шапки профиля или сторис
  return /(^|\.)instagram\.com$/.test(host) ? "instagram" : "external";
}

// Одно и то же событие чаще раза в 2 секунды не шлём (двойной эффект React, двойной клик)
const recent = new Map<string, number>();

export function track(event: TrackEvent) {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  if (entryPath === null) entryPath = pathname;
  else if (pathname !== entryPath) navigated = true;

  const key = JSON.stringify(event) + pathname;
  const now = Date.now();
  if (now - (recent.get(key) ?? 0) < 2000) return;
  recent.set(key, now);

  const source = event.type === "store_view" || event.type === "product_view" ? visitSource() : undefined;
  const payload = JSON.stringify({ ...event, source, visitorId: getVisitorId(), path: pathname });
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "text/plain" }))) return;
  } catch {
    // пробуем fetch
  }
  fetch("/api/track", { method: "POST", body: payload, keepalive: true }).catch(() => {});
}
