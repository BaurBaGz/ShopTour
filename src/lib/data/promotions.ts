import { createClient } from "@/lib/supabase/server";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { almatyToday } from "@/lib/utils/product";
import type { Database } from "@/types/database";

export type Promotion = Database["public"]["Tables"]["promotions"]["Row"];

export type PromotionWithStore = Promotion & {
  stores: { id: string; name: string; slug: string; city: string } | null;
};

/** Сначала акции, которые скоро закончатся, затем бессрочные — новые выше */
function bySoonest<T extends Promotion>(a: T, b: T) {
  if (a.ends_on && b.ends_on) return a.ends_on.localeCompare(b.ends_on);
  if (a.ends_on) return -1;
  if (b.ends_on) return 1;
  return b.created_at.localeCompare(a.created_at);
}

/** Действующие акции опубликованных магазинов — для вкладки «Скидки» */
export async function getActivePromotions(): Promise<PromotionWithStore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*, stores!promotions_store_id_fkey!inner ( id, name, slug, city, status )")
    .eq("stores.status", "published")
    .or(`ends_on.is.null,ends_on.gte.${almatyToday()}`);
  logSupabaseError("getActivePromotions", error);
  return ((data ?? []) as PromotionWithStore[]).sort(bySoonest);
}

/** Акции одного магазина; для кабинета и админки — вместе с закончившимися */
export async function getStorePromotions(storeId: string, options?: { includeExpired?: boolean }): Promise<Promotion[]> {
  const supabase = await createClient();
  let query = supabase.from("promotions").select("*").eq("store_id", storeId);
  if (!options?.includeExpired) query = query.or(`ends_on.is.null,ends_on.gte.${almatyToday()}`);
  const { data, error } = await query;
  logSupabaseError("getStorePromotions", error);
  return (data ?? []).sort(bySoonest);
}
