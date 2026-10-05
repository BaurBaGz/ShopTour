import type { Locale } from "@/lib/i18n/config";

/** Поля баннера, которые переводятся */
export const BANNER_TEXT_FIELDS = ["title", "accent", "body", "cta_label"] as const;
export type BannerTextField = (typeof BANNER_TEXT_FIELDS)[number];
export const BANNER_LOCALES = ["kk", "en"] as const;
export type BannerI18n = Partial<Record<(typeof BANNER_LOCALES)[number], Partial<Record<BannerTextField, string>>>>;

/** Переводы из базы (jsonb) в проверенном виде: только известные языки и поля, только непустые строки */
export function parseBannerI18n(value: unknown): BannerI18n {
  const result: BannerI18n = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const locale of BANNER_LOCALES) {
    const texts = (value as Record<string, unknown>)[locale];
    if (!texts || typeof texts !== "object") continue;
    for (const field of BANNER_TEXT_FIELDS) {
      const text = (texts as Record<string, unknown>)[field];
      if (typeof text === "string" && text.trim()) (result[locale] ??= {})[field] = text.trim();
    }
  }
  return result;
}

/** Тексты баннера на языке сайта; чего нет в переводе — остаётся по-русски */
export function localizeBanner<T extends Record<BannerTextField, string | null> & { i18n?: unknown }>(banner: T, locale: Locale): T {
  if (locale === "ru") return banner;
  const texts = parseBannerI18n(banner.i18n)[locale];
  return texts ? { ...banner, ...texts } : banner;
}
