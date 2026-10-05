"use server";

import { getT } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";
import { getSessionUser, requireStorePermission } from "@/lib/auth/session";
import { isUuid } from "@/lib/catalog-filters";
import { createClient } from "@/lib/supabase/server";
import { almatyToday } from "@/lib/utils/product";

export type PromotionState = { error?: string; success?: string };

const MAX_ACTIVE = 3;

function revalidatePromotions(storeId: string, slug?: string | null) {
  revalidatePath("/sale");
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/stores/${storeId}`);
  revalidatePath(`/admin/partners/${storeId}`);
  if (slug) revalidatePath(`/s/${slug}`);
}

/** Акцию добавляет владелец или сотрудник с доступом «Акции» */
export async function addPromotionAction(_prev: PromotionState, formData: FormData): Promise<PromotionState> {
  const c = (await getT()).cabinet.promotions;
  let store;
  try {
    ({ store } = await requireStorePermission("promotions"));
  } catch {
    return { error: c.errorNoAccess };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const endsOn = String(formData.get("endsOn") ?? "").trim() || null;
  if (title.length < 3 || title.length > 80) return { error: c.errorTitle };
  if (description && description.length > 300) return { error: c.errorTerms };
  if (endsOn !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || Number.isNaN(Date.parse(endsOn))) return { error: c.errorDate };
    if (endsOn < almatyToday()) return { error: c.errorPast };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("promotions")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .or(`ends_on.is.null,ends_on.gte.${almatyToday()}`);
  if ((count ?? 0) >= MAX_ACTIVE) return { error: c.errorLimit(MAX_ACTIVE) };

  const { error } = await supabase.from("promotions").insert({ store_id: store.id, title, description, ends_on: endsOn });
  if (error) return { error: error.message };
  revalidatePromotions(store.id, store.slug);
  return { success: c.added };
}

/** Снять акцию: владелец — свою, сотрудник — любую (права проверяет база) */
export async function deletePromotionAction(id: string): Promise<{ error?: string }> {
  const c = (await getT()).cabinet.promotions;
  if (!(await getSessionUser())) return { error: c.errorLogin };
  if (!isUuid(id)) return { error: c.errorNotFound };
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").delete().eq("id", id).select("store_id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: c.errorRemove };
  revalidatePromotions(data[0].store_id);
  return {};
}
