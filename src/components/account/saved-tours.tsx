"use client";

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

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function stopsWord(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "магазин";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "магазина";
  return "магазинов";
}

/** Карточки «Избранное» и «Текущий маршрут» */
export function AccountSummary() {
  const favorites = useFavoriteIds();
  const tourIds = useTourIds();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/favorites" className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-rose-200">
        <p className="text-sm text-stone-500">Избранное</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{favorites.length}</p>
        <p className="mt-1 text-sm font-medium text-rose-600">Смотреть →</p>
      </Link>
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <p className="text-sm text-stone-500">Текущий маршрут</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">
          {tourIds.length} <span className="text-base font-normal text-stone-500">{stopsWord(tourIds.length)}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <Link href="/stores?tour=1" className="rounded-full px-3 py-1.5 font-medium text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50">
            {tourIds.length ? "Открыть на карте" : "Собрать на карте"}
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

  if (tours.length === 0) {
    return (
      <p className="mt-2 text-sm text-stone-500">
        Пока нет. Соберите маршрут на карте и нажмите «Сохранить маршрут» — он появится здесь.
      </p>
    );
  }

  const open = (t: SavedTour) => {
    const differs = tourIds.length > 0 && (tourIds.length !== t.storeIds.length || tourIds.some((id, i) => id !== t.storeIds[i]));
    // Текущий маршрут не затираем молча
    if (differs && !(confirm?.id === t.id && confirm.action === "open")) {
      setConfirm({ id: t.id, action: "open" });
      return;
    }
    tour.replace(t.storeIds);
    router.push("/stores?tour=1");
  };

  const remove = async (t: SavedTour) => {
    if (!(confirm?.id === t.id && confirm.action === "delete")) {
      setConfirm({ id: t.id, action: "delete" });
      return;
    }
    setBusy(t.id);
    const { error } = await createClient().from("saved_tours").delete().eq("id", t.id);
    setBusy(null);
    setConfirm(null);
    if (error) console.error("[account] delete tour:", error.message);
    router.refresh();
  };

  return (
    <ul className="mt-3 divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
      {tours.map((t) => {
        const asking = confirm?.id === t.id ? confirm.action : null;
        return (
          <li key={t.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-stone-900">{t.name}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">
                {t.storeIds.length} {stopsWord(t.storeIds.length)}
                {t.storeNames.length > 0 && `: ${t.storeNames.join(" → ")}`}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">{dateFormat.format(new Date(t.createdAt))}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 text-sm">
              <button
                type="button"
                onClick={() => open(t)}
                className="min-h-11 rounded-xl bg-stone-900 px-4 font-semibold text-white transition hover:bg-rose-600"
              >
                {asking === "open" ? "Заменить текущий маршрут?" : "Открыть на карте"}
              </button>
              <button
                type="button"
                onClick={() => void remove(t)}
                disabled={busy === t.id}
                className="min-h-11 rounded-xl px-4 font-medium text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:text-red-700 disabled:opacity-60"
              >
                {asking === "delete" ? "Точно удалить?" : "Удалить"}
              </button>
              {asking && (
                <button type="button" onClick={() => setConfirm(null)} className="min-h-11 px-2 font-medium text-stone-500 hover:text-stone-900">
                  Отмена
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
