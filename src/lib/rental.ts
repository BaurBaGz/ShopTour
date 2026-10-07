// Прокат: товар продаётся (sale), сдаётся напрокат (rent) или и то и другое (both).
// Без серверных импортов — и для сервера, и для браузера.

export const LISTINGS = ["sale", "rent", "both"] as const;
export type Listing = (typeof LISTINGS)[number];

type ListedProduct = { listing?: string | null };

export function parseListing(value: unknown): Listing {
  return LISTINGS.includes(value as Listing) ? (value as Listing) : "sale";
}

/** Можно записаться на примерку для проката */
export const isForRent = (p: ListedProduct) => p.listing === "rent" || p.listing === "both";
/** Можно купить (отложить для покупки) */
export const isForSale = (p: ListedProduct) => p.listing !== "rent";

/** Цена проката за сутки (у товара только для проката она же лежит в price) */
export function rentPrice(p: ListedProduct & { price: number; rent_price?: number | null }): number {
  return p.rent_price ?? p.price;
}
