import { createClient } from "@/lib/supabase/server";

export async function getAdminStats() {
  const supabase = await createClient();

  const [{ count: storesCount }, { count: productsCount }, { count: categoriesCount }] =
    await Promise.all([
      supabase.from("stores").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
    ]);

  return {
    storesCount: storesCount ?? 0,
    productsCount: productsCount ?? 0,
    categoriesCount: categoriesCount ?? 0,
  };
}

export async function getAdminStores() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("*, products(count)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAdminProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, stores(name), categories(name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  return { error };
}

export async function deleteStore(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("stores").delete().eq("id", id);
  return { error };
}
