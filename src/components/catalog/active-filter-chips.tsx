"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { FilterChip, FilterKey } from "@/lib/catalog-filters";

type ActiveFilterChipsProps = {
  chips: FilterChip[];
  /** Параметры, которые «Сбросить все» оставляет (сортировка, выбранный магазин) */
  keepOnReset: FilterKey[];
};

// Ссылки строим из текущего адреса: на карте выбранный магазин меняется без перезагрузки
export function ActiveFilterChips({ chips, keepOnReset }: ActiveFilterChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (chips.length === 0) return null;

  const hrefWithout = (keys: FilterKey[]) => {
    const params = new URLSearchParams(searchParams);
    for (const key of keys) params.delete(key);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const resetHref = (() => {
    const params = new URLSearchParams();
    for (const key of keepOnReset) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={hrefWithout(chip.keys)}
          className="group inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-2 text-sm text-stone-700 ring-1 ring-stone-200 transition hover:ring-stone-300"
          aria-label={`Убрать фильтр: ${chip.label}`}
        >
          {chip.label}
          <span className="text-stone-400 group-hover:text-rose-600" aria-hidden>
            ✕
          </span>
        </Link>
      ))}
      {chips.length > 1 && (
        <Link
          href={resetHref}
          className="px-2 text-sm font-medium text-stone-500 hover:text-stone-900"
        >
          Сбросить все
        </Link>
      )}
    </div>
  );
}
