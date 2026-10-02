"use client";

import Image from "next/image";
import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import type { ProductWithRelations } from "@/lib/data/types";
import { AUDIENCE_COLOR } from "@/lib/audience";
import { useT } from "@/lib/i18n/client";
import { formatNearDistance } from "@/lib/near";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { formatDiscountDeadline, getAvailableSizes, getDiscountPercent } from "@/lib/utils/product";

type ProductCardProps = {
  product: ProductWithRelations;
  className?: string;
};

/** Карточка товара. Клиентский компонент: подписи берёт из словаря выбранного языка */
export function ProductCard({ product, className }: ProductCardProps) {
  const imageUrl = product.images?.[0];
  const store = product.stores;
  const discount = getDiscountPercent(product);
  const availableSizes = getAvailableSizes(product);
  const t = useT();
  const deadline = formatDiscountDeadline(product, t);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md",
        className,
      )}
    >
      <div className="relative">
        <Link
          href={`/products/${product.id}`}
          className="relative block aspect-[4/5] overflow-hidden bg-stone-100"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-500">
              <svg
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs">{t.product.noPhoto}</span>
            </div>
          )}
          {product.categories?.name && (
            <span className="absolute left-3 top-3 max-w-[calc(100%-4.5rem)] truncate rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm">
              {product.categories.name}
            </span>
          )}
          {discount && (
            <span className="absolute bottom-3 left-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
              −{discount}%
            </span>
          )}
        </Link>
        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute right-1 top-1"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.audience && (
          <p
            className={cn("-mb-1 text-[11px] font-semibold uppercase tracking-wide", AUDIENCE_COLOR[product.audience])}
            title={t.audience[product.audience].hint}
          >
            {t.audience[product.audience].label}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
          <Link
            href={`/products/${product.id}`}
            className="transition hover:text-rose-600"
          >
            {product.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              "text-sm font-bold",
              discount ? "text-rose-600" : "text-stone-900",
            )}
          >
            {formatPrice(product.price)}
          </span>
          {discount && product.old_price && (
            <span className="text-xs text-stone-500 line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
        </p>
        {deadline && <p className="-mt-1 text-xs font-medium text-rose-700">{deadline}</p>}

        {store && (
          <Link
            href={`/stores/${store.id}`}
            className="-my-1 py-1 text-xs text-stone-500 transition hover:text-rose-600"
          >
            {store.name}
            {store.city && product.distanceKm == null ? ` · ${store.city}` : ""}
          </Link>
        )}

        {product.distanceKm != null && (
          <p className="-mt-1 text-xs font-medium text-rose-700">📍 {formatNearDistance(product.distanceKm, t)}</p>
        )}

        {product.sizes?.length > 0 && (
          <p className="mt-auto text-xs text-stone-500">
            {availableSizes.length > 0
              ? t.product.sizes(availableSizes.join(", "))
              : t.product.outOfStock}
          </p>
        )}
      </div>
    </article>
  );
}
