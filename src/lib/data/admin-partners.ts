import { getUserEmails } from "@/lib/auth/accounts";
import type { Store } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";
import { getAvailableSizes } from "@/lib/utils/product";

export type PartnerStats = {
  total: number;
  inStock: number;
  discounted: number;
  withoutPhoto: number;
};

export type PartnerRow = Pick<
  Store,
  "id" | "name" | "address" | "city" | "status" | "logo_url" | "latitude" | "longitude" | "owner_id" | "created_at"
> & { ownerEmail: string | null; stats: PartnerStats };

type ProductLite = {
  store_id: string;
  in_stock: boolean;
  sizes: string[];
  size_stock: import("@/types/database").Json;
  images: string[];
  price: number;
  old_price: number | null;
};

function statsFor(products: ProductLite[]): PartnerStats {
  return {
    total: products.length,
    inStock: products.filter((p) => p.in_stock && (p.sizes.length === 0 || getAvailableSizes(p).length > 0)).length,
    discounted: products.filter((p) => p.old_price !== null && p.old_price > p.price).length,
    withoutPhoto: products.filter((p) => !p.images?.length).length,
  };
}

/** Все партнёры (любой статус) со сводкой товаров и email владельца. Только для сотрудников. */
export async function getPartners(): Promise<PartnerRow[]> {
  const supabase = await createClient();
  const [storesResult, productsResult] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, address, city, status, logo_url, latitude, longitude, owner_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("store_id, in_stock, sizes, size_stock, images, price, old_price"),
  ]);
  const stores = storesResult.data ?? [];
  const products = (productsResult.data ?? []) as ProductLite[];
  const emails = await getUserEmails(stores.map((s) => s.owner_id ?? ""));

  return stores.map((store) => ({
    ...store,
    ownerEmail: store.owner_id ? (emails.get(store.owner_id) ?? null) : null,
    stats: statsFor(products.filter((p) => p.store_id === store.id)),
  }));
}

export async function getPartner(id: string) {
  const supabase = await createClient();
  const [storeResult, productsResult] = await Promise.all([
    supabase.from("stores").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("products")
      .select("id, name, price, old_price, images, sizes, size_stock, in_stock, created_at, categories!products_category_id_fkey ( name )")
      .eq("store_id", id)
      .order("created_at", { ascending: false }),
  ]);
  const store = storeResult.data;
  if (!store) return null;
  const products = productsResult.data ?? [];
  const ownerEmail = store.owner_id ? ((await getUserEmails([store.owner_id])).get(store.owner_id) ?? null) : null;
  return {
    store,
    ownerEmail,
    products,
    stats: statsFor(products.map((p) => ({ ...p, store_id: id }))),
  };
}
