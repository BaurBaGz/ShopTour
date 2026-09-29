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
