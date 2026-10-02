"use client";

import { track } from "@/lib/analytics";
import { useCallback, useRef, useState } from "react";
import { ReserveSheet } from "@/components/catalog/reserve-sheet";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { formatStockLeft, getSizeStock } from "@/lib/utils/product";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { Json } from "@/types/database";

type ProductPurchaseProps = {
  product: {
    id: string;
    name: string;
    price: number;
    old_price?: number | null;
    sizes: string[];
    size_stock: Json;
    in_stock: boolean;
  };
  /** Номер для WhatsApp (whatsapp или phone магазина) */
  contactPhone: string | null;
  /** Вошедший покупатель (null — гость: бронь попросит войти) */
  viewer: { name: string; phone: string } | null;
  /** Вернулись после входа — открыть бронь сразу; значение — размер или «1» */
  reserveOnOpen?: string | null;
};

export function ProductPurchase({ product, contactPhone, viewer, reserveOnOpen = null }: ProductPurchaseProps) {
  const sizes = product.sizes ?? [];
  const stockOf = (size: string) => getSizeStock(product, size);
  const availableSizes = sizes.filter((size) => stockOf(size) !== 0);

  // Размер из ссылки «вернуться к брони»; единственный доступный — выбираем сразу
  const [selectedSize, setSelectedSize] = useState<string | null>(
    reserveOnOpen && availableSizes.includes(reserveOnOpen)
      ? reserveOnOpen
      : availableSizes.length === 1
        ? availableSizes[0]
        : null,
  );

  const selectedStock = selectedSize ? stockOf(selectedSize) : undefined;
  const stockText = formatStockLeft(selectedStock);
  const soldOut = !product.in_stock || (sizes.length > 0 && availableSizes.length === 0);

  const message = selectedSize
    ? `Здравствуйте! Пишу с ShopTour. Интересует «${product.name}», размер ${selectedSize}, за ${formatPrice(product.price)}. Он ещё в наличии?`
    : `Здравствуйте! Пишу с ShopTour. Интересует «${product.name}» за ${formatPrice(product.price)}. Он ещё в наличии?`;
  const whatsappHref = contactPhone ? buildWhatsAppUrl(contactPhone, message) : null;
  const trackWhatsApp = () => track({ type: "whatsapp_click", productId: product.id });
  const needsSize = sizes.length > 0 && !selectedSize && availableSizes.length > 1;
  const sizesRef = useRef<HTMLDivElement>(null);
  const [reserving, setReserving] = useState(Boolean(reserveOnOpen && viewer));
  const closeReserve = useCallback(() => setReserving(false), []);
  // Бронь: размер нужен, если он есть у товара
  const openReserve = () => (needsSize ? goToSizes() : setReserving(true));

  // Кнопка в нижней панели без выбранного размера ведёт к размерам
  const goToSizes = () => {
    sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    sizesRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({
      preventScroll: true,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {sizes.length > 0 && (
        <div ref={sizesRef} className="scroll-mt-24">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-stone-500">
              Размер{selectedSize ? `: ${selectedSize}` : ""}
            </h2>
            {!selectedSize && availableSizes.length > 1 && (
              <span className="text-xs text-stone-500">Выберите размер</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Размер">
            {sizes.map((size) => {
              const stock = stockOf(size);
              const unavailable = stock === 0;
              const selected = size === selectedSize;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={unavailable}
                  onClick={() => setSelectedSize(selected ? null : size)}
                  title={unavailable ? "Нет в наличии" : undefined}
                  className={cn(
                    "min-h-11 min-w-12 rounded-xl border px-3 py-2 text-sm font-medium transition",
                    selected
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 bg-white text-stone-800 hover:border-stone-400",
                    unavailable &&
                      "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300 line-through hover:border-stone-100",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>

          <p
            className={cn(
              "mt-3 min-h-5 text-sm",
              selectedStock !== undefined && selectedStock <= 2
                ? "font-medium text-rose-700"
                : "text-stone-500",
            )}
            aria-live="polite"
          >
            {selectedSize
              ? (stockText ?? "В наличии")
              : soldOut
                ? "Все размеры закончились"
                : null}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!soldOut && (
          <button
            type="button"
            onClick={openReserve}
            className="hidden min-h-11 items-center rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 sm:inline-flex"
          >
            {selectedSize ? `Отложить размер ${selectedSize}` : needsSize ? "Выбрать размер и отложить" : "Отложить в магазине"}
          </button>
        )}
        {whatsappHref && !soldOut && (
          <a
            href={whatsappHref}
            onClick={trackWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-[#15803D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166534] sm:inline-flex"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {selectedSize ? `Спросить про размер ${selectedSize}` : "Спросить в WhatsApp"}
          </a>
        )}
        <FavoriteButton productId={product.id} productName={product.name} variant="full" />
      </div>

      {/* Телефон: цена и главное действие всегда под пальцем */}
      <div
        data-mobile-buy-bar
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 pt-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight text-stone-900">
              {formatPrice(product.price)}
            </p>
            {product.old_price && product.old_price > product.price ? (
              <p className="text-xs text-stone-500 line-through">{formatPrice(product.old_price)}</p>
            ) : selectedSize ? (
              <p className="text-xs text-stone-500">Размер {selectedSize}</p>
            ) : null}
          </div>
          {soldOut ? (
            <span className="rounded-full bg-stone-100 px-4 py-3 text-sm font-medium text-stone-500">
              Нет в наличии
            </span>
          ) : needsSize ? (
            <button
              type="button"
              onClick={goToSizes}
              className="min-h-11 rounded-full bg-stone-900 px-5 text-sm font-semibold text-white"
            >
              Выбрать размер
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  onClick={trackWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={selectedSize ? `Спросить про размер ${selectedSize} в WhatsApp` : "Спросить в WhatsApp"}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#15803D] text-white"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              )}
              <button
                type="button"
                onClick={openReserve}
                className="min-h-11 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white"
              >
                {selectedSize ? `Отложить ${selectedSize}` : "Отложить"}
              </button>
            </div>
          )}
        </div>
      </div>

      {reserving && !needsSize && <ReserveSheet product={product} size={selectedSize} viewer={viewer} onClose={closeReserve} />}
    </div>
  );
}
