"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { MAX_TOUR_STOPS, tour, useTourIds } from "@/lib/tour";
import { optimizeOrder } from "@/lib/utils/route";

type BuildTourButtonProps = {
  /** Магазины, где лежат избранные товары */
  storeIds: string[];
};

/** Собирает маршрут по магазинам с избранным и открывает карту с ним */
export function BuildTourButton({ storeIds }: BuildTourButtonProps) {
  const router = useRouter();
  const t = useT();
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
          ? t.tour.building
          : status === "confirm"
            ? t.tour.confirmReplace
            : t.tour.build}
      </button>

      {status === "confirm" ? (
        <p className="text-xs text-stone-500">
          {t.tour.alreadyHas(tourIds.length)}{" "}
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900"
          >
            {t.common.cancel}
          </button>
        </p>
      ) : status === "error" ? (
        <p className="text-xs text-red-600">{t.tour.buildFailed}</p>
      ) : (
        <p className="text-xs text-stone-500">
          {t.tour.buildHint(uniqueIds.length)}
          {uniqueIds.length > MAX_TOUR_STOPS && t.tour.firstOnMap(MAX_TOUR_STOPS)}
        </p>
      )}
    </div>
  );
}
