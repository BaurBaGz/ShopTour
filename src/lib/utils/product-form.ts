// Разбор формы товара — общий для кабинета магазина и админки
import { parseAudience } from "@/lib/audience";
import type { ProductAudience } from "@/types/database";

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
    sizes.push(size);
    const stockRaw = String(row?.stock ?? "").trim();
    if (stockRaw === "") continue;
    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) return null;
    sizeStock[size] = stock;
  }
  return { sizes, sizeStock };
}

/** Ссылки на фото — по одной на строку (так их отдаёт поле загрузки) */
export function parseImages(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s));
}

export type ProductFields = {
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
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
  const audience = parseAudience(formData.get("audience"));
  if (!audience) return { error: "Выберите, для кого товар: женское, мужское, унисекс или детское" };
  if (!sizeStock) return { error: "Остаток по размеру должен быть целым числом от 0" };
  if (oldPrice !== null && (Number.isNaN(oldPrice) || oldPrice < 0)) {
    return { error: "Старая цена должна быть числом от 0" };
  }
  if (oldPrice !== null && oldPrice <= price) {
    return { error: "Старая цена должна быть больше текущей — иначе это не скидка" };
  }

  return {
    fields: {
      name,
      description: description || null,
      price,
      old_price: oldPrice,
      category_id: categoryId,
      sizes: sizeStock.sizes,
      size_stock: sizeStock.sizeStock,
      audience,
      images: parseImages(String(formData.get("images") ?? "")),
      in_stock: formData.get("inStock") === "on",
    },
  };
}
