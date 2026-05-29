"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStoreOwner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ProductActionState = {
  error?: string;
};

function parseSizes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
  const sizes = parseSizes(String(formData.get("sizes") ?? ""));
  const images = parseImages(String(formData.get("images") ?? ""));
  const inStock = formData.get("inStock") === "on";

  if (!name || !categoryId || Number.isNaN(price) || price < 0) {
    return { error: "Заполните название, категорию и цену" };
  }

  const payload = {
    store_id: store.id,
    name,
    description: description || null,
    price,
    category_id: categoryId,
    sizes,
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
