"use server";

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
  let store;
  try {
    ({ store } = await requireStorePermission("promotions"));
  } catch {
    return { error: "Нет доступа к акциям — обратитесь к владельцу магазина" };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const endsOn = String(formData.get("endsOn") ?? "").trim() || null;
  if (title.length < 3 || title.length > 80) return { error: "Название акции — от 3 до 80 символов" };
  if (description && description.length > 300) return { error: "Условия — не длиннее 300 символов" };
  if (endsOn !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || Number.isNaN(Date.parse(endsOn))) return { error: "Проверьте дату окончания" };
    if (endsOn < almatyToday()) return { error: "Дата окончания уже прошла" };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("promotions")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .or(`ends_on.is.null,ends_on.gte.${almatyToday()}`);
  if ((count ?? 0) >= MAX_ACTIVE) return { error: `Одновременно можно вести до ${MAX_ACTIVE} акций` };

  const { error } = await supabase.from("promotions").insert({ store_id: store.id, title, description, ends_on: endsOn });
  if (error) return { error: error.message };
  revalidatePromotions(store.id, store.slug);
  return { success: "Акция добавлена — покупатели уже видят её" };
}

/** Снять акцию: владелец — свою, сотрудник — любую (права проверяет база) */
export async function deletePromotionAction(id: string): Promise<{ error?: string }> {
  if (!(await getSessionUser())) return { error: "Войдите в аккаунт" };
  if (!isUuid(id)) return { error: "Акция не найдена" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").delete().eq("id", id).select("store_id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Не удалось снять акцию — нет прав или её уже нет" };
  revalidatePromotions(data[0].store_id);
  return {};
}
