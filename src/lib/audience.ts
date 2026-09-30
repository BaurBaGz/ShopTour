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

/** Метка на карточке товара: сразу видно, для кого вещь */
export const AUDIENCE_BADGE: Record<ProductAudience, { label: string; hint: string; className: string }> = {
  women: { label: "Женское", hint: "Женская модель", className: "text-rose-700" },
  men: { label: "Мужское", hint: "Мужская модель", className: "text-sky-700" },
  unisex: { label: "Унисекс", hint: "Подойдёт и женщинам, и мужчинам", className: "text-violet-700" },
  girls: { label: "Девочкам", hint: "Детская модель для девочек", className: "text-rose-700" },
  boys: { label: "Мальчикам", hint: "Детская модель для мальчиков", className: "text-sky-700" },
  kids: { label: "Детское", hint: "Детская модель — и девочкам, и мальчикам", className: "text-emerald-700" },
};

/** Раздел каталога для метки: по нажатию — все такие вещи */
export const AUDIENCE_SECTION: Record<ProductAudience, Section | null> = {
  women: "women",
  men: "men",
  unisex: null,
  girls: "girls",
  boys: "boys",
  kids: "kids",
};
