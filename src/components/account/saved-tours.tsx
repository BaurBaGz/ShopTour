"use client";

import { useT } from "@/lib/i18n/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SaveTourButton } from "@/components/account/save-tour-button";
import { useFavoriteIds } from "@/lib/favorites";
import { createClient } from "@/lib/supabase/client";
import { tour, useTourIds } from "@/lib/tour";

export type SavedTour = {
  id: string;
  name: string;
  storeIds: string[];
  storeNames: string[];
  createdAt: string;
};

/** Карточки «Избранное» и «Текущий маршрут» */
export function AccountSummary() {
  const favorites = useFavoriteIds();
  const tourIds = useTourIds();
  const t = useT();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/favorites" className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-rose-200">
        <p className="text-sm text-stone-500">{t.nav.favorites}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{favorites.length}</p>
        <p className="mt-1 text-sm font-medium text-rose-600">{t.favoritesPage.view}</p>
      </Link>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-500">{t.tour.current}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">
          {tourIds.length} <span className="text-base font-normal text-stone-500">{t.tour.storesWord(tourIds.length)}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link href="/stores?tour=1" className="rounded-full px-3 py-1.5 font-medium text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50">
            {tourIds.length ? t.tour.openOnMap : t.tour.buildOnMap}
          </Link>
          {tourIds.length > 0 && <SaveTourButton storeIds={tourIds} />}
        </div>
      </div>
    </div>
  );
}

/** Сохранённые маршруты: открыть на карте или удалить */
export function SavedTours({ tours }: { tours: SavedTour[] }) {
  const router = useRouter();
  const tourIds = useTourIds();
  const [confirm, setConfirm] = useState<{ id: string; action: "open" | "delete" } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const t = useT();
  const dateFormat = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long", year: "numeric" });

  if (tours.length === 0) {
    return (
      <p className="mt-2 text-sm text-stone-500">
        {t.tour.savedEmpty}
      </p>
    );
  }

  const open = (saved: SavedTour) => {
    const differs = tourIds.length > 0 && (tourIds.length !== saved.storeIds.length || tourIds.some((id, i) => id !== saved.storeIds[i]));
    // Текущий маршрут не затираем молча
    if (differs && !(confirm?.id === saved.id && confirm.action === "open")) {
      setConfirm({ id: saved.id, action: "open" });
      return;
    }
    tour.replace(saved.storeIds);
    router.push("/stores?tour=1");
  };

  const remove = async (saved: SavedTour) => {
    if (!(confirm?.id === saved.id && confirm.action === "delete")) {
      setConfirm({ id: saved.id, action: "delete" });
      return;
    }
    setBusy(saved.id);
    const { error } = await createClient().from("saved_tours").delete().eq("id", saved.id);
    setBusy(null);
    setConfirm(null);
    if (error) console.error("[account] delete tour:", error.message);
    router.refresh();
  };

  return (
    <ul className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
      {tours.map((saved) => {
        const asking = confirm?.id === saved.id ? confirm.action : null;
        return (
          <li key={saved.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-stone-900">{saved.name}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
                {saved.storeIds.length} {t.tour.storesWord(saved.storeIds.length)}
                {saved.storeNames.length > 0 && `: ${saved.storeNames.join(" → ")}`}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">{dateFormat.format(new Date(saved.createdAt))}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-sm">
              <button
                type="button"
                onClick={() => open(saved)}
                className="min-h-11 rounded-xl bg-stone-900 px-4 font-semibold text-white transition hover:bg-rose-600"
              >
                {asking === "open" ? t.tour.replaceCurrent : t.tour.openOnMap}
              </button>
              <button
                type="button"
                onClick={() => void remove(saved)}
                disabled={busy === saved.id}
                className="min-h-11 rounded-xl px-4 font-medium text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:text-red-700 disabled:opacity-60"
              >
                {asking === "delete" ? t.tour.confirmDelete : t.tour.delete}
              </button>
              {asking && (
                <button type="button" onClick={() => setConfirm(null)} className="min-h-11 px-2 font-medium text-stone-500 hover:text-stone-900">
                  {t.common.cancel}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
