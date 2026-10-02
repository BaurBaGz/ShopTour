import type { Json } from "@/types/database";

type PricedProduct = { price: number; old_price: number | null };
type StockedProduct = { sizes: string[]; size_stock: Json };

/** Процент скидки (целое число) или null, если скидки нет */
export function getDiscountPercent(product: PricedProduct): number | null {
  const { price, old_price } = product;
  if (!old_price || old_price <= price) return null;
  const percent = Math.round((1 - price / old_price) * 100);
  return percent > 0 ? percent : null;
}

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** Сегодняшняя дата в Алматы, «2026-11-05» */
export function almatyToday(now = Date.now()): string {
  return new Date(now + ALMATY_OFFSET_MS).toISOString().slice(0, 10);
}

/** Сколько дней до даты (0 — сегодня последний день, меньше 0 — прошла) */
export function daysUntil(date: string, today = almatyToday()): number {
  return Math.round((Date.parse(date) - Date.parse(today)) / DAY_MS);
}

function pluralDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

/** «до 5 ноября», «до 5 ноября · осталось 2 дня», «только сегодня»; null — срок прошёл */
export function formatUntil(date: string, today = almatyToday()): string | null {
  const daysLeft = daysUntil(date, today);
  if (daysLeft < 0) return null;
  if (daysLeft === 0) return "только сегодня";
  const [, month, day] = date.split("-").map(Number);
  const until = `до ${day} ${MONTHS[month - 1]}`;
  return daysLeft <= 3 ? `${until} · ${daysLeft === 1 ? "остался" : "осталось"} ${daysLeft} ${pluralDays(daysLeft)}` : until;
}

type DiscountedProduct = PricedProduct & { discount_until?: string | null };

/** Сколько дней осталось до конца скидки (0 — последний день, меньше 0 — срок прошёл); null — срока нет */
export function getDiscountDaysLeft(product: DiscountedProduct, today = almatyToday()): number | null {
  if (!product.discount_until || getDiscountPercent(product) === null) return null;
  return daysUntil(product.discount_until, today);
}

/** Скидка есть и её срок не прошёл */
export function isOnSale(product: DiscountedProduct, today = almatyToday()): boolean {
  if (getDiscountPercent(product) === null) return false;
  const daysLeft = getDiscountDaysLeft(product, today);
  return daysLeft === null || daysLeft >= 0;
}

/** «Скидка до 5 ноября», «Скидка только сегодня»; null — срока нет или он прошёл */
export function formatDiscountDeadline(product: DiscountedProduct, today = almatyToday()): string | null {
  if (getDiscountDaysLeft(product, today) === null) return null;
  const until = formatUntil(product.discount_until!, today);
  return until ? `Скидка ${until}` : null;
}

/**
 * Остаток по размеру: число — сколько осталось, undefined — магазин не указал остаток
 * (считаем, что размер в наличии).
 */
export function getSizeStock(product: StockedProduct, size: string): number | undefined {
  const stock = product.size_stock;
  if (!stock || typeof stock !== "object" || Array.isArray(stock)) return undefined;
  const value = stock[size];
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : undefined;
}

export function isSizeAvailable(product: StockedProduct, size: string): boolean {
  return getSizeStock(product, size) !== 0;
}

/** Размеры, которые можно купить (без закончившихся) */
export function getAvailableSizes(product: StockedProduct): string[] {
  return (product.sizes ?? []).filter((size) => isSizeAvailable(product, size));
}

/** «Осталось 3 шт.» / «Осталось всего 1 шт.»; null — остаток не указан */
export function formatStockLeft(stock: number | undefined): string | null {
  if (stock === undefined) return null;
  if (stock === 0) return "Нет в наличии";
  if (stock <= 2) return `Осталось всего ${stock} шт.`;
  return `В наличии ${stock} шт.`;
}
