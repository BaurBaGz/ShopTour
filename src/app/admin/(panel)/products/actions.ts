"use server";

import { getT } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaffForAction } from "@/lib/auth/staff";
import { parseAudience } from "@/lib/audience";
import { isUuid } from "@/lib/catalog-filters";
import { createClient } from "@/lib/supabase/server";
import { parseProductForm } from "@/lib/utils/product-form";

export type AdminProductState = { error?: string; success?: string };
export type BulkOp = "hide" | "show" | "discount" | "clear-discount" | "delete";

function revalidateProducts(productIds: string[] = []) {
  revalidatePath("/admin", "layout");
  revalidatePath("/catalog");
  revalidatePath("/stores", "layout");
  for (const id of productIds) revalidatePath(`/products/${id}`);
}

export async function saveAdminProductAction(
  productId: string | null,
  _prev: AdminProductState,
  formData: FormData,
): Promise<AdminProductState> {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const storeId = String(formData.get("storeId") ?? "");
  if (!isUuid(storeId)) return { error: "Выберите магазин" };
  const parsed = parseProductForm(formData, (await getT()).cabinet.productForm);
  if ("error" in parsed) return { error: parsed.error };

  const payload = { ...parsed.fields, store_id: storeId, is_hidden: formData.get("isHidden") === "on" };
  const supabase = await createClient();

  if (productId) {
    if (!isUuid(productId)) return { error: "Неверный товар" };
    const { error: updateError } = await supabase.from("products").update(payload).eq("id", productId);
    if (updateError) return { error: updateError.message };
    revalidateProducts([productId]);
    return { success: "Сохранено" };
  }

  const { data, error: insertError } = await supabase.from("products").insert(payload).select("id").single();
  if (insertError || !data) return { error: insertError?.message ?? "Не удалось создать товар" };
  revalidateProducts();
  redirect(`/admin/products/${data.id}?created=1`);
}

/** Быстрая правка цены из таблицы. Если цена стала не ниже старой — скидка снимается. */
export async function updateProductPriceAction(id: string, price: number) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id) || !Number.isFinite(price) || price < 0) return { error: "Неверная цена" };
  const supabase = await createClient();
  const { data: current } = await supabase.from("products").select("old_price").eq("id", id).maybeSingle();
  const oldPrice = current?.old_price != null && current.old_price > price ? current.old_price : null;
  const { error: updateError } = await supabase.from("products").update({ price, old_price: oldPrice, ...(oldPrice === null ? { discount_until: null } : {}) })
    .eq("id", id);
  if (updateError) return { error: updateError.message };
  revalidateProducts([id]);
  return { error: null };
}

/** Массовые действия над отмеченными товарами */
export async function bulkProductsAction(ids: string[], op: BulkOp, percent?: number) {
  const { staff, error } = await getStaffForAction(op === "delete" ? { admin: true } : undefined);
  if (!staff) return { error, count: 0 };
  const valid = ids.filter(isUuid);
  if (valid.length === 0) return { error: "Ничего не выбрано", count: 0 };
  const supabase = await createClient();

  if (op === "hide" || op === "show") {
    const { data, error: e } = await supabase.from("products").update({ is_hidden: op === "hide" }).in("id", valid).select("id");
    if (e) return { error: e.message, count: 0 };
    revalidateProducts(valid);
    return { error: null, count: data?.length ?? 0 };
  }

  if (op === "delete") {
    const { data, error: e } = await supabase.from("products").delete().in("id", valid).select("id");
    if (e) return { error: e.message, count: 0 };
    revalidateProducts(valid);
    return { error: null, count: data?.length ?? 0 };
  }

  // Скидки считаются от цены до скидки: у уже уценённого товара — от old_price
  const { data: rows, error: readError } = await supabase.from("products").select("id, price, old_price").in("id", valid);
  if (readError) return { error: readError.message, count: 0 };
  let count = 0;
  for (const row of rows ?? []) {
    const base = row.old_price && row.old_price > row.price ? row.old_price : row.price;
    // Новая или снятая скидка — прежний срок больше не действует
    let update: { price: number; old_price: number | null; discount_until: null };
    if (op === "clear-discount") {
      if (!row.old_price) continue;
      update = { price: base, old_price: null, discount_until: null };
    } else {
      if (!percent || percent < 1 || percent > 90) return { error: "Скидка — от 1 до 90%", count };
      // Округляем до 100 ₸ — цены на сайте «круглые»
      const discounted = Math.max(100, Math.round((base * (1 - percent / 100)) / 100) * 100);
      update = { price: discounted, old_price: base, discount_until: null };
    }
    const { error: e } = await supabase.from("products").update(update).eq("id", row.id);
    if (e) return { error: e.message, count };
    count++;
  }
  revalidateProducts(valid);
  return { error: null, count };
}

/** Массово: для кого товары (разделы каталога «Женщинам / Мужчинам / Детям») */
export async function bulkAudienceAction(ids: string[], audience: string) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error, count: 0 };
  const value = parseAudience(audience);
  if (!value) return { error: "Неизвестный раздел", count: 0 };
  const valid = ids.filter(isUuid);
  if (valid.length === 0) return { error: "Ничего не выбрано", count: 0 };
  const supabase = await createClient();
  const { data, error: e } = await supabase.from("products").update({ audience: value }).in("id", valid).select("id");
  if (e) return { error: e.message, count: 0 };
  revalidateProducts(valid);
  return { error: null, count: data?.length ?? 0 };
}
