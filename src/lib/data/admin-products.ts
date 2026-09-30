import { createClient } from "@/lib/supabase/server";
import type { Json, ProductAudience, StoreStatus } from "@/types/database";

export type AdminProductRow = {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  images: string[];
  sizes: string[];
  size_stock: Json;
  in_stock: boolean;
  is_hidden: boolean;
  audience: ProductAudience;
  created_at: string;
  store: { id: string; name: string; status: StoreStatus } | null;
  category: { id: string; name: string } | null;
};

/** Все товары для админки (скрытые и из черновиков тоже — RLS пускает сотрудников) */
export async function getAdminProducts(): Promise<AdminProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, price, old_price, images, sizes, size_stock, in_stock, is_hidden, audience, created_at, store:stores!products_store_id_fkey ( id, name, status ), category:categories!products_category_id_fkey ( id, name )",
    )
    .order("created_at", { ascending: false });
  if (error) console.error("[admin] products:", error.message);
  return (data as unknown as AdminProductRow[]) ?? [];
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return data;
}

/** Магазины и категории для выпадающих списков */
export async function getProductFormOptions() {
  const supabase = await createClient();
  const [stores, categories] = await Promise.all([
    supabase.from("stores").select("id, name, status").order("name"),
    supabase.from("categories").select("id, name").order("sort_order").order("name"),
  ]);
  return { stores: stores.data ?? [], categories: categories.data ?? [] };
}
