import { cookies } from "next/headers";
import { cache } from "react";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/i18n/config";
import { dictionaryFor, type Dictionary } from "@/lib/i18n/dictionaries";

/** Язык посетителя (cookie); кэш на один запрос */
export const getLocale = cache(async (): Promise<Locale> => parseLocale((await cookies()).get(LOCALE_COOKIE)?.value));

/** Словарь для серверных компонентов и действий: const t = await getT() */
export async function getT(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
