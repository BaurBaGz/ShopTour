"use client";

import { useT } from "@/lib/i18n/client";

type SupabaseErrorBannerProps = {
  message: string;
  context?: string;
};

/** Каталог не загрузился: понятное сообщение посетителю; техническая причина — мелко, для поддержки */
export function SupabaseErrorBanner({ message, context }: SupabaseErrorBannerProps) {
  const t = useT();
  return (
    <div role="alert" className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left sm:px-5">
      <p className="text-sm font-semibold text-red-800">{t.catalog.loadErrorTitle}</p>
      <p className="mt-1 text-sm text-red-700">{t.catalog.loadErrorHint}</p>
      <p className="mt-2 font-mono text-xs leading-relaxed text-red-600/80">
        {context ? `${context}: ` : ""}
        {message}
      </p>
    </div>
  );
}
