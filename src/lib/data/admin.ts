import { createClient } from "@/lib/supabase/server";
import { getAvailableSizes } from "@/lib/utils/product";

export type AdminOverview = {
  stores: { total: number; newThisWeek: number; withoutLocation: number; withoutOwner: number };
  products: {
    total: number;
    newThisWeek: number;
    withoutPhoto: number;
    soldOut: number;
    discounted: number;
  };
  categories: number;
  staff: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Сводка для «Главной» админки: сколько всего и что требует внимания */
export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const [storesResult, productsResult, categoriesResult, staffResult] = await Promise.all([
    supabase.from("stores").select("id, owner_id, latitude, longitude, created_at"),
    supabase.from("products").select("id, images, sizes, size_stock, in_stock, price, old_price, created_at"),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("staff").select("user_id", { count: "exact", head: true }),
  ]);

  const weekAgo = Date.now() - WEEK_MS;
  const isNew = (createdAt: string) => Date.parse(createdAt) >= weekAgo;
  const stores = storesResult.data ?? [];
  const products = productsResult.data ?? [];

  return {
    stores: {
      total: stores.length,
      newThisWeek: stores.filter((s) => isNew(s.created_at)).length,
      withoutLocation: stores.filter((s) => s.latitude === null || s.longitude === null).length,
      withoutOwner: stores.filter((s) => !s.owner_id).length,
    },
    products: {
      total: products.length,
      newThisWeek: products.filter((p) => isNew(p.created_at)).length,
      withoutPhoto: products.filter((p) => !p.images?.length).length,
      soldOut: products.filter(
        (p) => !p.in_stock || (p.sizes.length > 0 && getAvailableSizes(p).length === 0),
      ).length,
      discounted: products.filter((p) => p.old_price !== null && p.old_price > p.price).length,
    },
    categories: categoriesResult.count ?? 0,
    staff: staffResult.count ?? 0,
  };
}
