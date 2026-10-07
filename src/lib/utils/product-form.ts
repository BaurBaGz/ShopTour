// Разбор формы товара — общий для кабинета магазина и админки
import { parseAudience } from "@/lib/audience";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { parseListing, type Listing } from "@/lib/rental";
import { almatyToday } from "@/lib/utils/product";
import type { ProductAudience } from "@/types/database";

// Пределы — чтобы в базу нельзя было записать мусор огромного размера
const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_SIZES = 40;
const MAX_SIZE_LENGTH = 20;
const MAX_IMAGES = 8;
const MAX_URL_LENGTH = 500;
const MAX_PRICE = 99_999_999;

/** Размеры и остатки из редактора: [{ size, stock }] → список размеров и { размер: остаток } */
export function parseSizeStock(raw: string): {
  sizes: string[];
  sizeStock: Record<string, number>;
} | null {
  let rows: unknown;
  try {
    rows = JSON.parse(raw || "[]");
  } catch {
    return null;
  }
  if (!Array.isArray(rows)) return null;

  const sizes: string[] = [];
  const sizeStock: Record<string, number> = {};
  for (const row of rows) {
    const size = String(row?.size ?? "").trim();
    if (!size || sizes.includes(size)) continue;
    if (size.length > MAX_SIZE_LENGTH || sizes.length >= MAX_SIZES) return null;
    sizes.push(size);
    const stockRaw = String(row?.stock ?? "").trim();
    if (stockRaw === "") continue;
    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0 || stock > 9999) return null;
    sizeStock[size] = stock;
  }
  return { sizes, sizeStock };
}

/** Ссылки на фото — по одной на строку (так их отдаёт поле загрузки); только https */
export function parseImages(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^https:\/\/\S+$/.test(s) && s.length <= MAX_URL_LENGTH)
    .slice(0, MAX_IMAGES);
}

export type ProductFields = {
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  discount_until: string | null;
  category_id: string;
  sizes: string[];
  size_stock: Record<string, number>;
  images: string[];
  in_stock: boolean;
  audience: ProductAudience;
  listing: Listing;
  rent_price: number | null;
  rent_terms: string | null;
  rent_deposit: string | null;
};

/** Поля товара из формы с проверками; ошибка — понятным текстом для формы */
export function parseProductForm(formData: FormData, c: Dictionary["cabinet"]["productForm"]): { fields: ProductFields } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  // Прокат: у товара только для проката цена продажи не нужна — в price кладём цену за сутки
  const listing = parseListing(formData.get("listing"));
  const rentPriceRaw = String(formData.get("rentPrice") ?? "").trim();
  const rentPrice = listing === "sale" || rentPriceRaw === "" ? null : Number(rentPriceRaw);
  const rentTerms = listing === "sale" ? "" : String(formData.get("rentTerms") ?? "").trim();
  const rentDeposit = listing === "sale" ? "" : String(formData.get("rentDeposit") ?? "").trim();
  const price = listing === "rent" ? (rentPrice ?? NaN) : Number(formData.get("price"));
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const sizeStock = parseSizeStock(String(formData.get("sizeStock") ?? ""));
  const oldPriceRaw = String(formData.get("oldPrice") ?? "").trim();
  const oldPrice = oldPriceRaw === "" ? null : Number(oldPriceRaw);

  if (listing !== "sale" && (rentPrice === null || !Number.isFinite(rentPrice) || rentPrice < 0)) {
    return { error: c.errorRentPrice };
  }
  if (rentTerms.length > 300) return { error: c.errorRentTermsLong };
  if (rentDeposit.length > 100) return { error: c.errorRentDepositLong };
  if (!name || !categoryId || Number.isNaN(price) || price < 0) {
    return { error: c.errorRequired };
  }
  if (name.length > MAX_NAME_LENGTH) return { error: c.errorNameLong(MAX_NAME_LENGTH) };
  if (description.length > MAX_DESCRIPTION_LENGTH) return { error: c.errorDescriptionLong(MAX_DESCRIPTION_LENGTH) };
  if (price > MAX_PRICE || (oldPrice !== null && oldPrice > MAX_PRICE)) return { error: c.errorPriceHigh };
  const audience = parseAudience(formData.get("audience"));
  if (!audience) return { error: c.errorAudience };
  if (!sizeStock) return { error: c.errorStock };
  if (oldPrice !== null && (Number.isNaN(oldPrice) || oldPrice < 0)) {
    return { error: c.errorOldPrice };
  }
  if (oldPrice !== null && oldPrice <= price) {
    return { error: c.errorOldPriceLow };
  }

  // Срок скидки имеет смысл только вместе со старой ценой
  const untilRaw = String(formData.get("discountUntil") ?? "").trim();
  const discountUntil = oldPrice !== null && untilRaw ? untilRaw : null;
  if (discountUntil !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(discountUntil) || Number.isNaN(Date.parse(discountUntil))) {
      return { error: c.errorDiscountDate };
    }
    if (discountUntil < almatyToday()) return { error: c.errorDiscountPast };
  }

  return {
    fields: {
      name,
      description: description || null,
      price,
      // Скидка — только на продажу
      old_price: listing === "rent" ? null : oldPrice,
      discount_until: listing === "rent" ? null : discountUntil,
      category_id: categoryId,
      sizes: sizeStock.sizes,
      size_stock: sizeStock.sizeStock,
      audience,
      images: parseImages(String(formData.get("images") ?? "")),
      in_stock: formData.get("inStock") === "on",
      listing,
      rent_price: rentPrice,
      rent_terms: rentTerms || null,
      rent_deposit: rentDeposit || null,
    },
  };
}
