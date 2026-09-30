// Разделы каталога «Для кого». Без серверных импортов — и для сервера, и для браузера.
import type { ProductAudience } from "@/types/database";

/** Раздел в адресе страницы (?for=…) */
export type Section = "women" | "men" | "kids" | "girls" | "boys";

export const SECTIONS: { id: Section; label: string }[] = [
  { id: "women", label: "Женщинам" },
  { id: "men", label: "Мужчинам" },
  { id: "kids", label: "Детям" },
];

export const KIDS_SECTIONS: { id: Section; label: string }[] = [
  { id: "kids", label: "Всё детское" },
  { id: "girls", label: "Девочкам" },
  { id: "boys", label: "Мальчикам" },
];

/** Какие товары показывать в разделе: унисекс — и женщинам, и мужчинам */
export const SECTION_AUDIENCES: Record<Section, ProductAudience[]> = {
  women: ["women", "unisex"],
  men: ["men", "unisex"],
  kids: ["kids", "girls", "boys"],
  girls: ["girls", "kids"],
  boys: ["boys", "kids"],
};

export function parseSection(value?: string | null): Section | null {
  return value && value in SECTION_AUDIENCES ? (value as Section) : null;
}

export const isKidsSection = (s: Section | null) => s === "kids" || s === "girls" || s === "boys";

/** Выбор «Для кого» в форме товара */
export const AUDIENCE_OPTIONS: { id: ProductAudience; label: string }[] = [
  { id: "women", label: "Женское" },
  { id: "men", label: "Мужское" },
  { id: "unisex", label: "Унисекс" },
  { id: "girls", label: "Девочкам" },
  { id: "boys", label: "Мальчикам" },
  { id: "kids", label: "Детское унисекс" },
];

export function parseAudience(value: unknown): ProductAudience | null {
  return AUDIENCE_OPTIONS.some((o) => o.id === value) ? (value as ProductAudience) : null;
}

/** Запомненный раздел покупателя (cookie — чтобы сервер сразу отдал нужные товары) */
export const SECTION_COOKIE = "shoptour_section";
