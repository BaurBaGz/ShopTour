"use client";

import type { MapStore } from "@/lib/data/catalog";
import { MAX_TOUR_STOPS, tour } from "@/lib/tour";
import { cn } from "@/lib/utils/cn";
import {
  formatDistance,
  formatDuration,
  googleMapsRouteUrl,
  optimizeOrder,
  routeLegs,
  walkingMinutes,
  yandexMapsRouteUrl,
} from "@/lib/utils/route";
import { getStoreColor, getStoreInitial } from "@/lib/utils/store-color";

type TourPanelProps = {
  /** На широком экране панель не выше карты — список прокручивается внутри */
  maxHeight: number;
  /** Остановки по порядку (только магазины с координатами) */
  stops: MapStore[];
  /** Магазины с избранными товарами — для «Собрать из избранного» */
  favoriteStores: MapStore[];
  selectedId: string | null;
  onSelect: (storeId: string) => void;
  onClose: () => void;
};

const toPoint = (store: MapStore) => ({
  id: store.id,
  lat: store.latitude!,
  lng: store.longitude!,
});

const smallButton =
  "flex h-11 w-11 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 sm:h-8 sm:w-8 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30";

export function TourPanel({
  maxHeight,
  stops,
  favoriteStores,
  selectedId,
  onSelect,
  onClose,
}: TourPanelProps) {
  const points = stops.map(toPoint);
  const legs = routeLegs(points);
  const totalKm = legs.reduce((sum, leg) => sum + leg, 0);

  const optimize = () => tour.replace(optimizeOrder(points).map((p) => p.id));

  const buildFromFavorites = () =>
    tour.replace(optimizeOrder(favoriteStores.map(toPoint)).map((p) => p.id));

  return (
    <section
      aria-label="Маршрут"
      style={{ "--tour-max-h": `${maxHeight}px` } as React.CSSProperties}
      className="flex flex-col rounded-3xl border border-stone-200/80 bg-white p-5 lg:max-h-[var(--tour-max-h)] lg:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Маршрут</h2>
          <p className="text-sm text-stone-500">Магазины по порядку обхода</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Скрыть маршрут"
          className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {stops.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
          <p>
            Выберите магазин на карте и нажмите{" "}
            <span className="font-medium text-stone-900">«+ В маршрут»</span>{" "}
            — он станет остановкой маршрута.
          </p>
          {favoriteStores.length > 0 && (
            <p className="mt-2">
              Или соберите тур из магазинов с вашим избранным.
            </p>
          )}
        </div>
      ) : (
        <>
          <ol className="mt-4 flex flex-col">
            {stops.map((store, index) => (
              <li key={store.id}>
                {index > 0 && (
                  <p className="py-1 pl-12 text-xs text-stone-500">
                    ↓ {formatDistance(legs[index - 1])} ·{" "}
                    {formatDuration(walkingMinutes(legs[index - 1]))}
                  </p>
                )}
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-2 transition",
                    store.id === selectedId
                      ? "bg-rose-50"
                      : "hover:bg-stone-50",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelect(store.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getStoreColor(store.id) }}
                      aria-hidden
                    >
                      {getStoreInitial(store.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-stone-900">
                        {store.name}
                      </span>
                      <span className="block truncate text-xs text-stone-500">
                        {store.address}
                      </span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => tour.move(store.id, -1)}
                      disabled={index === 0}
                      aria-label={`Поднять ${store.name} выше`}
                      className={smallButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => tour.move(store.id, 1)}
                      disabled={index === stops.length - 1}
                      aria-label={`Опустить ${store.name} ниже`}
                      className={smallButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => tour.remove(store.id)}
                      aria-label={`Убрать ${store.name} из маршрута`}
                      className={smallButton}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-4 text-sm text-stone-600">
            <span className="font-semibold text-stone-900">
              {stops.length}{" "}
              {stops.length === 1
                ? "остановка"
                : stops.length < 5
                  ? "остановки"
                  : "остановок"}
            </span>
            {stops.length > 1 && (
              <>
                {" "}
                · {formatDistance(totalKm)} · ~
                {formatDuration(walkingMinutes(totalKm))} пешком
              </>
            )}
          </p>
          {stops.length > 1 && (
            <p className="text-xs text-stone-500">
              Расстояние по прямой, по улицам будет чуть больше
            </p>
          )}
          {stops.length >= MAX_TOUR_STOPS && (
            <p className="mt-1 text-xs text-amber-700">
              Максимум {MAX_TOUR_STOPS} остановок — столько принимают навигаторы
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <a
              href={googleMapsRouteUrl(points)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Открыть в Google Картах
            </a>
            <a
              href={yandexMapsRouteUrl(points)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-stone-50"
            >
              Открыть в Яндекс Картах
            </a>
            <p className="text-center text-xs text-stone-500">
              Google начнёт маршрут от вашего местоположения
            </p>
          </div>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4 text-sm">
        {stops.length > 2 && (
          <button
            type="button"
            onClick={optimize}
            className="rounded-full px-3 py-1.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
          >
            Оптимальный порядок
          </button>
        )}
        {favoriteStores.length > 0 && (
          <button
            type="button"
            onClick={buildFromFavorites}
            className="rounded-full px-3 py-1.5 font-medium text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
          >
            ♥ Собрать из избранного
          </button>
        )}
        {stops.length > 0 && (
          <button
            type="button"
            onClick={() => tour.clear()}
            className="rounded-full px-3 py-1.5 font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            Очистить
          </button>
        )}
      </div>
    </section>
  );
}
