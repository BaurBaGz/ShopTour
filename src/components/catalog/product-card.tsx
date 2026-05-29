import Image from "next/image";
import Link from "next/link";
import type { ProductWithRelations } from "@/lib/data/types";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type ProductCardProps = {
  product: ProductWithRelations;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const imageUrl = product.images?.[0];
  const store = product.stores;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md",
        className,
      )}
    >
      <Link
        href={store ? `/stores/${store.id}` : "/catalog"}
        className="relative aspect-[4/5] overflow-hidden bg-stone-100"
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
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
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
            <span className="text-xs">Нет фото</span>
          </div>
        )}
        {product.categories?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm">
            {product.categories.name}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
            {product.name}
          </h3>
          <p className="shrink-0 text-sm font-bold text-stone-900">
            {formatPrice(product.price)}
          </p>
        </div>

        {store && (
          <Link
            href={`/stores/${store.id}`}
            className="text-xs text-stone-500 transition hover:text-rose-600"
          >
            {store.name}
            {store.city ? ` · ${store.city}` : ""}
          </Link>
        )}

        {product.sizes?.length > 0 && (
          <p className="mt-auto text-xs text-stone-400">
            Размеры: {product.sizes.join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}
