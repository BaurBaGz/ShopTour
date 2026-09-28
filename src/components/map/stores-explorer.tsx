"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import StoresMap from "@/components/map/StoresMapWrapper";
import { StoreAvatar } from "@/components/store/store-avatar";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { MapStore } from "@/lib/data/catalog";
import type { ProductWithRelations } from "@/lib/data/types";
import { formatProductCount } from "@/lib/utils/format";
import { buildInstagramUrl } from "@/lib/utils/instagram";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

const FULL_MAP_HEIGHT = 600;
const COMPACT_MAP_HEIGHT = FULL_MAP_HEIGHT / 2;

type StoresExplorerProps = {
  stores: MapStore[];
  products: ProductWithRelations[];
  initialStoreId?: string;
  /** Показывать на значках число подходящих товаров (включены фильтры) */
  showCounts?: boolean;
};

export function StoresExplorer({
  stores,
  products,
  initialStoreId,
  showCounts = false,
}: StoresExplorerProps) {
  const [chosenId, setSelectedId] = useState<string | null>(initialStoreId ?? null);
  const panelRef = useRef<HTMLElement>(null);

  // Магазин мог пропасть с карты после смены фильтров — тогда выбор снимается
  const selectedStore = stores.find((s) => s.id === chosenId) ?? null;
  const selectedId = selectedStore?.id ?? null;

  // Мемоизация обязательна: новый объект пересобирает маркеры и сбрасывает масштаб карты
  const counts = useMemo(() => {
    if (!showCounts) return undefined;
    const result: Record<string, number> = {};
    for (const product of products) {
      result[product.store_id] = (result[product.store_id] ?? 0) + 1;
    }
    return result;
  }, [products, showCounts]);
  const storeProducts = selectedStore
    ? products.filter((p) => p.store_id === selectedStore.id)
    : [];

  const select = useCallback(
    (storeId: string | null) => {
      setSelectedId(selectedId === storeId ? null : storeId);
    },
    [selectedId],
  );

  // Выбранный магазин — в адресе страницы, чтобы ссылкой можно было поделиться
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) {
      url.searchParams.set("store", selectedId);
    } else {
      url.searchParams.delete("store");
    }
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  // После выбора показываем начало каталога магазина
  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
      <StoresMap
        stores={stores}
        height={selectedStore ? COMPACT_MAP_HEIGHT : FULL_MAP_HEIGHT}
        selectedId={selectedId}
        onSelect={select}
        counts={counts}
      />

      {selectedStore ? (
        <section
          ref={panelRef}
          aria-label={`Каталог магазина ${selectedStore.name}`}
          className="scroll-mt-24"
        >
          <div className="relative flex flex-col gap-4 rounded-3xl border border-stone-200/80 bg-white p-5 pr-14 sm:flex-row sm:items-center sm:p-6 sm:pr-16">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
              <StoreAvatar store={selectedStore} sizes="64px" textClassName="text-2xl" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-stone-900">
                {selectedStore.name}
              </h2>
              <p className="text-sm text-stone-500">
                {selectedStore.city}, {selectedStore.address} ·{" "}
                {formatProductCount(storeProducts.length)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
              В этом магазине пока нет товаров в наличии.
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
