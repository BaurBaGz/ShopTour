// Языки сайта. Без серверных импортов — используется и на сервере, и в браузере.
export const LOCALES = ["ru", "kk", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

/** Выбранный язык запоминается в cookie — сервер сразу отдаёт страницу на нём */
export const LOCALE_COOKIE = "shoptour_lang";

/** Короткая подпись в переключателе */
export const LOCALE_LABELS: Record<Locale, string> = { ru: "Рус", kk: "Қаз", en: "Eng" };
/** Полное название языка — на нём самом */
export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", kk: "Қазақша", en: "English" };

export function parseLocale(value: unknown): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
