"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { isKidsSection, KIDS_SECTIONS, SECTION_COOKIE, SECTIONS, type Section } from "@/lib/audience";
import { cn } from "@/lib/utils/cn";

/** «Все · Женщинам · Мужчинам · Детям» над каталогом. Выбор запоминается. */
export function SectionTabs({ current, saleLink = false }: { current: Section | null; saleLink?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const choose = (section: Section | null) => {
    // Год помним выбор; «Все» тоже запоминаем, чтобы не открывать раздел против желания
    document.cookie = `${SECTION_COOKIE}=${section ?? "all"}; path=/; max-age=31536000; samesite=lax`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("for", section ?? "all");
    // Категории у разделов разные — выбранная могла исчезнуть
    params.delete("category");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const main = isKidsSection(current) ? "kids" : current;
  const pill = (active: boolean) =>
    cn(
      "min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition",
      active ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
    );

  return (
    <nav aria-label="Для кого" aria-busy={pending} className="flex flex-col gap-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <button type="button" onClick={() => choose(null)} aria-pressed={main === null} className={pill(main === null)}>
          Все
        </button>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" onClick={() => choose(s.id)} aria-pressed={main === s.id} className={pill(main === s.id)}>
            {s.label}
          </button>
        ))}
        {saleLink && (
          <Link
            href={current ? `/sale?for=${current}` : "/sale"}
            className="flex min-h-10 shrink-0 items-center rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            % Скидки
          </Link>
        )}
      </div>
      {isKidsSection(current) && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {KIDS_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => choose(s.id)}
              aria-pressed={current === s.id}
              className={cn(
                "min-h-9 shrink-0 rounded-full px-3 text-sm font-medium transition",
                current === s.id ? "bg-rose-100 text-rose-800" : "text-stone-600 hover:bg-stone-100",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
