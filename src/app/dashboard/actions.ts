"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStoreOwner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ProductActionState = {
  error?: string;
};

/** Размеры и остатки из редактора: [{ size, stock }] → список размеров и { размер: остаток } */
function parseSizeStock(raw: string): {
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

function parseImages(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    redirect("/auth/login");
  }

  const productId = String(formData.get("productId") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const sizeStockResult = parseSizeStock(
    String(formData.get("sizeStock") ?? ""),
  );
  const oldPriceRaw = String(formData.get("oldPrice") ?? "").trim();
  const oldPrice = oldPriceRaw === "" ? null : Number(oldPriceRaw);
  const images = parseImages(String(formData.get("images") ?? ""));
  const inStock = formData.get("inStock") === "on";

  if (!name || !categoryId || Number.isNaN(price) || price < 0) {
    return { error: "Заполните название, категорию и цену" };
  }

  if (!sizeStockResult) {
    return { error: "Остаток по размеру должен быть целым числом от 0" };
  }

  if (oldPrice !== null && (Number.isNaN(oldPrice) || oldPrice < 0)) {
    return { error: "Старая цена должна быть числом от 0" };
  }

  if (oldPrice !== null && oldPrice <= price) {
    return {
      error: "Старая цена должна быть больше текущей — иначе это не скидка",
    };
  }

  const payload = {
    store_id: store.id,
    name,
    description: description || null,
    price,
    old_price: oldPrice,
    category_id: categoryId,
    sizes: sizeStockResult.sizes,
    size_stock: sizeStockResult.sizeStock,
    images,
    in_stock: inStock,
  };

  const supabase = await createClient();

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)
      .eq("store_id", store.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/catalog");
  revalidatePath(`/stores/${store.id}`);
  redirect("/dashboard");
}

export async function deleteProductAction(productId: string) {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", store.id);

  revalidatePath("/dashboard");
  revalidatePath("/catalog");
  revalidatePath(`/stores/${store.id}`);
}
