"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_TOUR_STOPS, tour, useTourIds } from "@/lib/tour";
import { optimizeOrder } from "@/lib/utils/route";

type BuildTourButtonProps = {
  /** Магазины, где лежат избранные товары */
  storeIds: string[];
};

function storesWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "магазину";
  return "магазинам";
}

/** Собирает маршрут по магазинам с избранным и открывает карту с ним */
export function BuildTourButton({ storeIds }: BuildTourButtonProps) {
  const router = useRouter();
  const tourIds = useTourIds();
  const [status, setStatus] = useState<"idle" | "confirm" | "loading" | "error">("idle");

  const uniqueIds = [...new Set(storeIds)];
  const sameTour =
    tourIds.length === uniqueIds.length && uniqueIds.every((id) => tourIds.includes(id));

  const build = async () => {
    setStatus("loading");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id, latitude, longitude")
      .in("id", uniqueIds)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error || !data?.length) {
      if (error) console.error("[favorites] build tour:", error.message);
      setStatus("error");
      return;
    }

    const points = data.map((s) => ({ id: s.id, lat: s.latitude!, lng: s.longitude! }));
    tour.replace(optimizeOrder(points).map((p) => p.id));
    router.push("/stores?view=favorites&tour=1");
  };

  const onClick = () => {
    // Свой маршрут не затираем молча
    if (tourIds.length > 0 && !sameTour && status !== "confirm") {
      setStatus("confirm");
      return;
    }
    void build();
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={onClick}
        disabled={status === "loading"}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        {status === "loading"
          ? "Строим маршрут…"
          : status === "confirm"
            ? "Да, заменить маршрут"
            : "Построить маршрут"}
      </button>

      {status === "confirm" ? (
        <p className="text-xs text-stone-500">
          В маршруте уже {tourIds.length} ост. — новый заменит его.{" "}
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900"
          >
            Отмена
          </button>
        </p>
      ) : status === "error" ? (
        <p className="text-xs text-red-600">Не удалось построить маршрут. Попробуйте ещё раз.</p>
      ) : (
        <p className="text-xs text-stone-500">
          Маршрут по {uniqueIds.length} {storesWord(uniqueIds.length)} с вашим избранным
          {uniqueIds.length > MAX_TOUR_STOPS && ` (на карте — первые ${MAX_TOUR_STOPS})`}
        </p>
      )}
    </div>
  );
}
