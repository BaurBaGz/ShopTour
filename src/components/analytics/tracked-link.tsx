"use client";

import type { AnchorHTMLAttributes } from "react";
import { track, type TrackEvent } from "@/lib/analytics";

/** Обычная ссылка (WhatsApp, телефон), нажатие на которую попадает в статистику магазина */
export function TrackedLink({ event, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { event: TrackEvent }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(event);
        onClick?.(e);
      }}
    />
  );
}
