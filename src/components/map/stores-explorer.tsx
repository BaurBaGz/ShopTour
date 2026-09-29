"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { HeartIcon } from "@/components/favorites/favorite-button";
import type { FavoritePreview } from "@/components/map/StoresMap";
import StoresMap from "@/components/map/StoresMapWrapper";
import { TourPanel } from "@/components/map/tour-panel";
import { StoreAvatar } from "@/components/store/store-avatar";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { MapStore } from "@/lib/data/catalog";
import type { ProductWithRelations } from "@/lib/data/types";
import { useFavoriteIds } from "@/lib/favorites";
import { MAX_TOUR_STOPS, tour, useTourIds } from "@/lib/tour";
import { cn } from "@/lib/utils/cn";
import { formatProductCount } from "@/lib/utils/format";
import { buildInstagramUrl } from "@/lib/utils/instagram";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

const FULL_MAP_HEIGHT = 600;
const COMPACT_MAP_HEIGHT = FULL_MAP_HEIGHT / 2;

type MapMode = "all" | "favorites";

type StoresExplorerProps = {
  /** Магазины, подходящие под фильтры */
  stores: MapStore[];
  /** Все магазины с координатами — остановки Shop Tour видны при любых фильтрах */
  allStores: MapStore[];
  products: ProductWithRelations[];
  initialStoreId?: string;
  initialMode?: MapMode;
  /** Открыть панель Shop Tour сразу (переход со страницы «Избранное») */
  openTour?: boolean;
  /** Показывать на значках число подходящих товаров (включены фильтры) */
  showCounts?: boolean;
};

export function StoresExplorer({
  stores,
  allStores,
  products,
  initialStoreId,
  initialMode = "all",
  openTour = false,
  showCounts = false,
}: StoresExplorerProps) {
  const [chosenId, setSelectedId] = useState<string | null>(
    initialStoreId ?? null,
  );
  const [mode, setMode] = useState<MapMode>(initialMode);
  // null — «по умолчанию»: панель тура открыта, если в туре есть остановки
  const [tourPanel, setTourPanel] = useState<boolean | null>(openTour ? true : null);
  const panelRef = useRef<HTMLElement>(null);

  const favoriteIds = useFavoriteIds();
  const tourIds = useTourIds();

  // Избранные товары по магазинам (в порядке избранного) — для режима и карточек при наведении
  const favoritesByStore = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const result: Record<string, FavoritePreview[]> = {};
    for (const id of favoriteIds) {
      const product = byId.get(id);
      if (!product) continue;
      (result[product.store_id] ??= []).push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] ?? null,
      });
    }
    return result;
  }, [products, favoriteIds]);

  const favoriteStores = useMemo(
    () => allStores.filter((s) => favoritesByStore[s.id]?.length),
    [allStores, favoritesByStore],
  );
  const favoriteCount = Object.values(favoritesByStore).reduce(
    (n, items) => n + items.length,
    0,
  );

  // Остановки тура по порядку; магазины без координат пропускаем
  const tourStops = useMemo(
    () =>
      tourIds
        .map((id) => allStores.find((s) => s.id === id))
        .filter((s): s is MapStore => Boolean(s)),
    [tourIds, allStores],
  );

  // На карте: магазины режима + остановки тура (чтобы маршрут не терял точки).
  // Мемоизация обязательна: новый массив пересобирает маркеры и сдвигает карту.
  const mapStores = useMemo(() => {
    const base = mode === "favorites" ? favoriteStores : stores;
    const ids = new Set(base.map((s) => s.id));
    return [...base, ...tourStops.filter((s) => !ids.has(s.id))];
  }, [mode, favoriteStores, stores, tourStops]);

  const counts = useMemo(() => {
    if (mode === "favorites") {
      return Object.fromEntries(
        Object.entries(favoritesByStore).map(([id, items]) => [
          id,
          items.length,
        ]),
      );
    }
    if (!showCounts) return undefined;
    const result: Record<string, number> = {};
    for (const product of products) {
      result[product.store_id] = (result[product.store_id] ?? 0) + 1;
    }
    return result;
  }, [mode, favoritesByStore, products, showCounts]);

  // Магазин мог пропасть с карты после смены фильтров — тогда выбор снимается
  const selectedStore = mapStores.find((s) => s.id === chosenId) ?? null;
  const selectedId = selectedStore?.id ?? null;

  const favoriteSet = new Set(favoriteIds);
  const storeProducts = selectedStore
    ? products.filter(
        (p) =>
          p.store_id === selectedStore.id &&
          (mode === "all" || favoriteSet.has(p.id)),
      )
    : [];

  const tourOpen = tourPanel ?? tourStops.length > 0;
  const stopNumber = selectedId ? tourIds.indexOf(selectedId) + 1 : 0;

  const select = useCallback(
    (storeId: string | null) => {
      setSelectedId(selectedId === storeId ? null : storeId);
    },
    [selectedId],
  );

  // Из списка тура выбираем магазин без «переключения» (повторный клик не закрывает)
  const focusStore = useCallback(
    (storeId: string) => setSelectedId(storeId),
    [],
  );

  // Выбранный магазин и режим — в адресе страницы, чтобы ссылкой можно было поделиться
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) {
      url.searchParams.set("store", selectedId);
    } else {
      url.searchParams.delete("store");
    }
    if (mode === "favorites") {
      url.searchParams.set("view", "favorites");
    } else {
      url.searchParams.delete("view");
    }
    // tour=1 нужен только для первого открытия — дальше панелью управляет пользователь
    url.searchParams.delete("tour");
    window.history.replaceState(null, "", url);
  }, [selectedId, mode]);

  // После выбора показываем начало каталога магазина
  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      panelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 320);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  const contactPhone = selectedStore?.whatsapp ?? selectedStore?.phone;
  const whatsappHref =
    selectedStore && contactPhone
      ? buildWhatsAppUrl(
          contactPhone,
          `Здравствуйте! Пишу с ShopTour по магазину «${selectedStore.name}».`,
        )
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full bg-stone-100 p-1 text-sm font-medium"
          role="group"
          aria-label="Какие магазины показать"
        >
          <button
            type="button"
            onClick={() => setMode("all")}
            aria-pressed={mode === "all"}
            className={cn(
              "rounded-full px-4 py-2 transition",
              mode === "all"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-900",
            )}
          >
            Все магазины
          </button>
          <button
            type="button"
            onClick={() => setMode("favorites")}
            aria-pressed={mode === "favorites"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 transition",
              mode === "favorites"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-stone-500 hover:text-stone-900",
            )}
          >
            <HeartIcon filled={mode === "favorites"} className="h-4 w-4" />
            Избранное на карте
            {favoriteCount > 0 && (
              <span className="rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setTourPanel(!tourOpen)}
          aria-expanded={tourOpen}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
            tourOpen
              ? "bg-stone-900 text-white hover:bg-stone-800"
              : "text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50",
          )}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Shop Tour
          {tourStops.length > 0 && (
            <span className="rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
              {tourStops.length}
            </span>
          )}
        </button>
      </div>

      {mode === "favorites" && favoriteStores.length === 0 && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {favoriteIds.length === 0
            ? "В избранном пока пусто — отметьте сердечком товары в каталоге, и их магазины появятся здесь."
            : "Товаров из избранного нет среди найденных — попробуйте сбросить фильтры."}
        </p>
      )}

      <div
        className={cn(
          "grid gap-6",
          tourOpen && "lg:grid-cols-[minmax(0,1fr)_360px]",
        )}
      >
        <StoresMap
          stores={mapStores}
          height={selectedStore ? COMPACT_MAP_HEIGHT : FULL_MAP_HEIGHT}
          selectedId={selectedId}
          onSelect={select}
          counts={counts}
          favoritesByStore={favoritesByStore}
          tourIds={tourIds}
        />
        {tourOpen && (
          <TourPanel
            maxHeight={selectedStore ? COMPACT_MAP_HEIGHT : FULL_MAP_HEIGHT}
            stops={tourStops}
            favoriteStores={favoriteStores}
            selectedId={selectedId}
            onSelect={focusStore}
            onClose={() => setTourPanel(false)}
          />
        )}
      </div>

      {selectedStore ? (
        <section
          ref={panelRef}
          aria-label={`Каталог магазина ${selectedStore.name}`}
          className="scroll-mt-24"
        >
          <div className="relative flex flex-col gap-4 rounded-3xl border border-stone-200/80 bg-white p-5 pr-14 sm:flex-row sm:items-center sm:p-6 sm:pr-16">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
              <StoreAvatar
                store={selectedStore}
                sizes="64px"
                textClassName="text-2xl"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-stone-900">
                {selectedStore.name}
              </h2>
              <p className="text-sm text-stone-500">
                {selectedStore.city}, {selectedStore.address} ·{" "}
                {mode === "favorites"
                  ? `${formatProductCount(storeProducts.length)} из избранного`
                  : formatProductCount(storeProducts.length)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {stopNumber > 0 ? (
                  <button
                    type="button"
                    onClick={() => tour.remove(selectedStore.id)}
                    className="rounded-full bg-stone-900 px-4 py-2 font-semibold text-white transition hover:bg-stone-700"
                    title="Убрать из маршрута"
                  >
                    ✓ В Shop Tour · остановка {stopNumber}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      tour.add(selectedStore.id);
                      setTourPanel(true);
                    }}
                    disabled={tourIds.length >= MAX_TOUR_STOPS}
                    className="rounded-full px-4 py-2 font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:bg-stone-50 disabled:opacity-40"
                  >
                    + В Shop Tour
                  </button>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-semibold text-white transition hover:bg-[#20bd5a]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {selectedStore.instagram && (
                  <a
                    href={buildInstagramUrl(selectedStore.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    Instagram
                  </a>
                )}
                <Link
                  href={`/stores/${selectedStore.id}`}
                  className="rounded-full px-4 py-2 font-medium text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
                >
                  Страница магазина →
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={() => select(null)}
              aria-label="Закрыть каталог магазина"
              className="absolute right-3 top-3 rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-900 sm:right-4 sm:top-1/2 sm:-translate-y-1/2"
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

          {storeProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {storeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-sm text-stone-500">
              {mode === "favorites"
                ? "Из избранного здесь ничего нет."
                : "В этом магазине пока нет товаров в наличии."}
            </div>
          )}
        </section>
      ) : (
        <p className="text-center text-sm text-stone-500">
          Нажмите на логотип магазина, чтобы открыть его каталог
        </p>
      )}
    </div>
  );
}
