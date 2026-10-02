"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { dictionaryFor, type Dictionary } from "@/lib/i18n/dictionaries";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Язык выбирает сервер (cookie) и передаёт сюда — клиентские компоненты берут словарь по нему */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Словарь для клиентских компонентов: const t = useT() */
export function useT(): Dictionary {
  return dictionaryFor(useContext(LocaleContext));
}
