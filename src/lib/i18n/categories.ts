import type { Locale } from "@/lib/i18n/config";

type TranslatedName = { name: string; name_kk?: string | null; name_en?: string | null };

/** Название категории на языке сайта; без перевода — русское */
export function localizedName(item: TranslatedName, locale: Locale): string {
  if (locale === "kk") return item.name_kk || item.name;
  if (locale === "en") return item.name_en || item.name;
  return item.name;
}

/** Товар с названием категории на языке сайта (остальные поля не трогаем) */
export function localizeProductCategory<T extends { categories: (TranslatedName & { id: string }) | null }>(product: T, locale: Locale): T {
  if (locale === "ru" || !product.categories) return product;
  return { ...product, categories: { ...product.categories, name: localizedName(product.categories, locale) } };
}
