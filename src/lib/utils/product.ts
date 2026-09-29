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
