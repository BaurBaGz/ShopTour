"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/favorites/favorite-button";
import { useFavoriteIds } from "@/lib/favorites";
import { useT } from "@/lib/i18n/client";

export function FavoritesLink() {
  const count = useFavoriteIds().length;
  const t = useT();

  return (
    <Link
      href="/favorites"
      aria-label={count > 0 ? t.nav.favoritesCount(count) : t.nav.favorites}
      title={t.nav.favorites}
      className="relative -mx-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-rose-600"
    >
      <HeartIcon filled={count > 0} className={count > 0 ? "h-5 w-5 text-rose-600" : "h-5 w-5"} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
