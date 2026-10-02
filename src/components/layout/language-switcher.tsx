"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALE_COOKIE, LOCALE_LABELS, LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/cn";

/** Переключатель языка: запоминает выбор на год и перерисовывает страницу на новом языке */
export function LanguageSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const choose = (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div role="group" aria-label={t.common.languageLabel} aria-busy={pending} className={cn("flex items-center gap-0.5", className)}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          title={LOCALE_NAMES[code]}
          aria-pressed={code === locale}
          onClick={() => choose(code)}
          className={cn(
            "min-h-9 rounded-full px-2 text-xs font-semibold transition",
            code === locale ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900",
          )}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
