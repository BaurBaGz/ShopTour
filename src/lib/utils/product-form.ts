// Разбор формы товара — общий для кабинета магазина и админки
import { parseAudience } from "@/lib/audience";
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
};

/** Поля товара из формы с проверками; ошибка — понятным текстом для формы */
export function parseProductForm(formData: FormData): { fields: ProductFields } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const sizeStock = parseSizeStock(String(formData.get("sizeStock") ?? ""));
  const oldPriceRaw = String(formData.get("oldPrice") ?? "").trim();
  const oldPrice = oldPriceRaw === "" ? null : Number(oldPriceRaw);

  if (!name || !categoryId || Number.isNaN(price) || price < 0) {
    return { error: "Заполните название, категорию и цену" };
  }
  if (name.length > MAX_NAME_LENGTH) return { error: `Название — не длиннее ${MAX_NAME_LENGTH} символов` };
  if (description.length > MAX_DESCRIPTION_LENGTH) return { error: `Описание — не длиннее ${MAX_DESCRIPTION_LENGTH} символов` };
  if (price > MAX_PRICE || (oldPrice !== null && oldPrice > MAX_PRICE)) return { error: "Слишком большая цена" };
  const audience = parseAudience(formData.get("audience"));
  if (!audience) return { error: "Выберите, для кого товар: женское, мужское, унисекс или детское" };
  if (!sizeStock) return { error: "Остаток по размеру должен быть целым числом от 0" };
  if (oldPrice !== null && (Number.isNaN(oldPrice) || oldPrice < 0)) {
    return { error: "Старая цена должна быть числом от 0" };
  }
  if (oldPrice !== null && oldPrice <= price) {
    return { error: "Старая цена должна быть больше текущей — иначе это не скидка" };
  }

  // Срок скидки имеет смысл только вместе со старой ценой
  const untilRaw = String(formData.get("discountUntil") ?? "").trim();
  const discountUntil = oldPrice !== null && untilRaw ? untilRaw : null;
  if (discountUntil !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(discountUntil) || Number.isNaN(Date.parse(discountUntil))) {
      return { error: "Проверьте дату окончания скидки" };
    }
    if (discountUntil < almatyToday()) return { error: "Дата окончания скидки уже прошла" };
  }

  return {
    fields: {
      name,
      description: description || null,
      price,
      old_price: oldPrice,
      discount_until: discountUntil,
      category_id: categoryId,
      sizes: sizeStock.sizes,
      size_stock: sizeStock.sizeStock,
      audience,
      images: parseImages(String(formData.get("images") ?? "")),
      in_stock: formData.get("inStock") === "on",
    },
  };
}
