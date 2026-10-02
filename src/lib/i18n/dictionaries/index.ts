import type { Locale } from "@/lib/i18n/config";
import en from "./en";
import kk from "./kk";
import ru, { type Dictionary } from "./ru";

export type { Dictionary };

const DICTIONARIES: Record<Locale, Dictionary> = { ru, kk, en };

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
