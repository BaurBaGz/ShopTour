"use client";

import { useFavorite } from "@/lib/favorites";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

type FavoriteButtonProps = {
  productId: string;
  productName: string;
  /** icon — круглая кнопка на карточке, full — кнопка с подписью на странице товара */
  variant?: "icon" | "full";
  className?: string;
};

export function HeartIcon({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-9.5-9.3C1.1 7.9 3.3 4.5 6.8 4.5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.5 0 5.7 3.4 4.3 6.7-2 4.7-9.5 9.3-9.5 9.3z"
      />
    </svg>
  );
}

export function FavoriteButton({
  productId,
  productName,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorite(productId);
  const t = useT();
  const label = isFavorite ? t.favorites.remove(productName) : t.favorites.add(productName);

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isFavorite}
        aria-label={label}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
          isFavorite
            ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
            : "text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
          className,
        )}
      >
        <HeartIcon filled={isFavorite} className="h-5 w-5" />
        {isFavorite ? t.favorites.inFavorites : t.favorites.toFavorites}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isFavorite}
      aria-label={label}
      title={isFavorite ? t.favorites.removeShort : t.favorites.toFavorites}
      // Зона нажатия 44×44, видимый круг 36 — палец попадает, а карточка не перегружена
      className={cn(
        "group/fav flex h-11 w-11 items-center justify-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition group-hover/fav:scale-110",
          isFavorite
            ? "text-rose-600"
            : "text-stone-500 group-hover/fav:text-rose-600",
        )}
      >
        <HeartIcon filled={isFavorite} className="h-5 w-5" />
      </span>
    </button>
  );
}
