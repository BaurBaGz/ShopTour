"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/client";
import { PRIVACY } from "@/lib/i18n/content/privacy";
import { cn } from "@/lib/utils/cn";

/** Строка согласия под формами, где человек оставляет личные данные (регистрация, бронь) */
export function PrivacyConsent({ className }: { className?: string }) {
  const c = PRIVACY[useLocale()];
  return (
    <p className={cn("text-xs text-stone-500", className)}>
      {c.consentBefore}{" "}
      <Link href="/privacy" target="_blank" className="font-medium text-stone-700 underline underline-offset-2 hover:text-rose-600">
        {c.consentLink}
      </Link>
      .
    </p>
  );
}
