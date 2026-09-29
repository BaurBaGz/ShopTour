"use client";

import { useState } from "react";
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
    sizes: string[];
    size_stock: Json;
    in_stock: boolean;
  };
  /** Номер для WhatsApp (whatsapp или phone магазина) */
  contactPhone: string | null;
};

export function ProductPurchase({ product, contactPhone }: ProductPurchaseProps) {
  const sizes = product.sizes ?? [];
  const stockOf = (size: string) => getSizeStock(product, size);
  const availableSizes = sizes.filter((size) => stockOf(size) !== 0);

  // Единственный доступный размер выбираем сразу
  const [selectedSize, setSelectedSize] = useState<string | null>(
    availableSizes.length === 1 ? availableSizes[0] : null,
  );

  const selectedStock = selectedSize ? stockOf(selectedSize) : undefined;
  const stockText = formatStockLeft(selectedStock);
  const soldOut = !product.in_stock || (sizes.length > 0 && availableSizes.length === 0);

  const message = selectedSize
    ? `Здравствуйте! Пишу с ShopTour. Интересует «${product.name}», размер ${selectedSize}, за ${formatPrice(product.price)}. Он ещё в наличии?`
    : `Здравствуйте! Пишу с ShopTour. Интересует «${product.name}» за ${formatPrice(product.price)}. Он ещё в наличии?`;
  const whatsappHref = contactPhone ? buildWhatsAppUrl(contactPhone, message) : null;

  return (
    <div className="flex flex-col gap-5">
      {sizes.length > 0 && (
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-stone-500">
              Размер{selectedSize ? `: ${selectedSize}` : ""}
            </h2>
            {!selectedSize && availableSizes.length > 1 && (
              <span className="text-xs text-stone-400">Выберите размер</span>
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
                    "min-w-12 rounded-xl border px-3 py-2 text-sm font-medium transition",
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
                ? "font-medium text-rose-600"
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
        {whatsappHref && !soldOut && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20bd5a]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {selectedSize ? `Спросить про размер ${selectedSize}` : "Спросить в WhatsApp"}
          </a>
        )}
        <FavoriteButton productId={product.id} productName={product.name} variant="full" />
      </div>
    </div>
  );
}
