"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { canGoBackInApp } from "@/lib/navigation-history";

type BackLinkProps = {
  /** Куда вести, если страницу открыли по прямой ссылке */
  fallbackHref: string;
  fallbackLabel: string;
};

/** «Назад» как в браузере — к фильтрам и месту в списке; без истории — по ссылке */
export function BackLink({ fallbackHref, fallbackLabel }: BackLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      onClick={(event) => {
        if (!canGoBackInApp()) return;
        event.preventDefault();
        router.back();
      }}
      className="-mx-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-stone-500 transition hover:text-stone-900"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {/* Подпись одна и та же на сервере и в браузере — без «прыжка» текста */}
      Назад<span className="sr-only">{` (${fallbackLabel})`}</span>
    </Link>
  );
}
