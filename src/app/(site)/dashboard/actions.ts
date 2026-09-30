"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStoreOwner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseProductForm } from "@/lib/utils/product-form";

export type ProductActionState = {
  error?: string;
};

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
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const payload = { store_id: store.id, ...parsed.fields };

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
  // «Сохранить и добавить ещё» — сразу пустая форма для следующей вещи
  redirect(!productId && formData.get("then") === "new" ? "/dashboard/products/new?added=1" : "/dashboard");
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

type QuickResult = { error?: string };

async function ownerStoreId(): Promise<string | null> {
  try {
    return (await requireStoreOwner()).store.id;
  } catch {
    return null;
  }
}

function revalidateStore(storeId: string, slug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/catalog");
  revalidatePath(`/stores/${storeId}`);
  if (slug) revalidatePath(`/s/${slug}`);
}

/**
 * Остаток одного размера прямо из списка товаров: число — сколько штук, null — «есть» без счёта.
 * Для кнопок «−»/«+» и «нет/есть» в кабинете на телефоне.
 */
export async function setSizeStockAction(productId: string, size: string, stock: number | null): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  if (stock !== null && (!Number.isInteger(stock) || stock < 0 || stock > 9999)) return { error: "Неверный остаток" };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("sizes, size_stock")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!product || !product.sizes.includes(size)) return { error: "Товар не найден" };

  const current =
    product.size_stock && typeof product.size_stock === "object" && !Array.isArray(product.size_stock)
      ? { ...(product.size_stock as Record<string, number>) }
      : {};
  if (stock === null) delete current[size];
  else current[size] = stock;

  const { error } = await supabase
    .from("products")
    .update({ size_stock: current })
    .eq("id", productId)
    .eq("store_id", storeId);
  if (error) return { error: error.message };
  revalidateStore(storeId);
  return {};
}

/** Весь товар «в наличии» / «нет в наличии» одним касанием */
export async function setInStockAction(productId: string, inStock: boolean): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ in_stock: inStock })
    .eq("id", productId)
    .eq("store_id", storeId);
  if (error) return { error: error.message };
  revalidateStore(storeId);
  return {};
}

export type SlugState = { error?: string; success?: string };

/** Свой короткий адрес витрины: shoptour.kz/s/<slug> */
export async function updateSlugAction(_prev: SlugState, formData: FormData): Promise<SlugState> {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    return { error: "Войдите в аккаунт магазина" };
  }
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
    return { error: "Только латинские буквы, цифры и дефис, от 3 до 40 символов" };
  }
  if (slug === store.slug) return { success: "Адрес не изменился" };

  const supabase = await createClient();
  const { error } = await supabase.from("stores").update({ slug }).eq("id", store.id);
  if (error) {
    if (error.code === "23505") return { error: "Этот адрес уже занят другим магазином — попробуйте другой" };
    return { error: error.message };
  }
  revalidateStore(store.id, store.slug);
  revalidatePath(`/s/${slug}`);
  return { success: "Адрес витрины изменён. Не забудьте обновить ссылку в Instagram." };
}
