"use client";

import { useT } from "@/lib/i18n/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PENDING_RESERVE_KEY } from "@/components/catalog/reserve-sheet";

type Pending = { href: string; name: string; size: string | null; at: number };

/** «Вы хотели отложить…» — после регистрации и подтверждения почты возвращаем к брони */
export function PendingReserve() {
  const t = useT();
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PENDING_RESERVE_KEY) ?? "null") as Pending | null;
      // Напоминаем сутки — дальше это уже неактуально
      if (saved?.href?.startsWith("/products/") && Date.now() - saved.at < 24 * 60 * 60 * 1000) setPending(saved);
      else window.localStorage.removeItem(PENDING_RESERVE_KEY);
    } catch {
      // без напоминания
    }
  }, []);

  if (!pending) return null;

  const forget = () => {
    try {
      window.localStorage.removeItem(PENDING_RESERVE_KEY);
    } catch {
      // ничего страшного
    }
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-rose-950">
        {t.reserve.pendingWanted} <span className="font-semibold">«{pending.name}»</span>
        {pending.size ? t.reserve.sizeSuffix(pending.size) : ""}.
      </p>
      <div className="flex gap-2">
        <Link href={pending.href} className="inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700">
          {t.reserve.pendingContinue}
        </Link>
        <button type="button" onClick={forget} className="min-h-11 px-3 text-sm font-medium text-rose-800 hover:text-rose-950">
          {t.reserve.pendingDismiss}
        </button>
      </div>
    </div>
  );
}
