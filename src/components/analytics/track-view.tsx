"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track, type TrackEvent } from "@/lib/analytics";

/** Отправляет событие один раз при показе страницы (товар, магазин, поиск) */
export function TrackView(props: TrackEvent) {
  const { type, productId, storeId, bannerId, query, results } = props;

  useEffect(() => {
    track({ type, productId, storeId, bannerId, query, results });
  }, [type, productId, storeId, bannerId, query, results]);

  return null;
}

// Кабинет и вход — служебные страницы, в посещаемость сайта не входят
const SKIP_PREFIXES = ["/dashboard", "/auth"];

/** Просмотр каждой страницы публичной части сайта */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
    track({ type: "page_view" });
  }, [pathname]);

  return null;
}
