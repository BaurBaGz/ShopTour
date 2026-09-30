// Общие фильтры товаров для каталога (/catalog) и карты магазинов (/stores).
// Без серверных импортов — используется и на сервере, и в клиентских компонентах.
import type { ProductSort } from "@/lib/data/catalog";
import { parseNear, parseWalk } from "@/lib/near";
import { formatPrice } from "@/lib/utils/format";

// near — точка покупателя «широта,долгота», walk — минут пешком, place — подпись точки (адрес)
export const FILTER_KEYS = ["q", "category", "store", "size", "min", "max", "sort", "near", "walk", "place"] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];
export type CatalogFilterValues = Partial<Record<FilterKey, string>>;

export type FilterChip = {
  label: string;
  /** Параметры адреса, которые убирает крестик на чипсе */
  keys: FilterKey[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SORTS: ProductSort[] = ["new", "price_asc", "price_desc"];

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// Берём по одному значению на параметр; неверные id отбрасываем, иначе Postgres вернёт ошибку
export function readFilterValues(
  params: Record<string, string | string[] | undefined>,
): CatalogFilterValues {
  const values: CatalogFilterValues = {};
  for (const key of FILTER_KEYS) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value) values[key] = value;
  }
  if (values.category && !isUuid(values.category)) delete values.category;
  if (values.store && !isUuid(values.store)) delete values.store;
  if (!parseNear(values.near)) {
    delete values.near;
    delete values.walk;
    delete values.place;
  }
  if (values.walk && !parseWalk(values.walk)) delete values.walk;
  if (values.place) values.place = values.place.slice(0, 80);
  return values;
}

export function parsePrice(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

export function parseSort(value?: string): ProductSort | undefined {
  return SORTS.find((s) => s === value);
}

export function buildFilterHref(basePath: string, values: CatalogFilterValues): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Подписи выбранных фильтров для чипсов */
export function buildFilterChips(
  values: CatalogFilterValues,
  names: {
    categories: { id: string; name: string }[];
    stores?: { id: string; name: string }[];
  },
): FilterChip[] {
  const chips: FilterChip[] = [];

  if (values.near) {
    const walk = parseWalk(values.walk);
    const where = values.place ? `Рядом: ${values.place}` : "Рядом со мной";
    chips.push({ label: walk ? `${where} · до ${walk} мин пешком` : where, keys: ["near", "walk", "place"] });
  }

  if (values.q) chips.push({ label: `«${values.q}»`, keys: ["q"] });

  const category = names.categories.find((c) => c.id === values.category);
  if (category) chips.push({ label: category.name, keys: ["category"] });

  const store = names.stores?.find((s) => s.id === values.store);
  if (store) chips.push({ label: store.name, keys: ["store"] });

  if (values.size) chips.push({ label: `Размер ${values.size}`, keys: ["size"] });

  const min = parsePrice(values.min);
  const max = parsePrice(values.max);
  if (min !== undefined || max !== undefined) {
    const label =
      min !== undefined && max !== undefined
        ? `${formatPrice(min)} — ${formatPrice(max)}`
        : min !== undefined
          ? `от ${formatPrice(min)}`
          : `до ${formatPrice(max!)}`;
    chips.push({ label, keys: ["min", "max"] });
  }

  return chips;
}
