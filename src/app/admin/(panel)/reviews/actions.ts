"use server";

import { revalidatePath } from "next/cache";
import { getStaffForAction } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { error?: string };

async function revalidateReview(id: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("reviews").select("product_id, store:stores!reviews_store_id_fkey ( id, slug )").eq("id", id).maybeSingle();
  const store = (data?.store ?? null) as unknown as { id: string; slug: string } | null;
  revalidatePath("/admin/reviews");
  if (data?.product_id) revalidatePath(`/products/${data.product_id}`);
  if (store) {
    revalidatePath(`/stores/${store.id}`);
    revalidatePath(`/s/${store.slug}`);
  }
}

/** Скрыть отзыв (виден только автору и магазину) или вернуть на сайт; жалоба при этом закрывается */
export async function setReviewStatusAction(id: string, status: "published" | "hidden"): Promise<Result> {
  const { error: accessError } = await getStaffForAction();
  if (accessError) return { error: accessError };
  if (!isUuid(id)) return { error: "Отзыв не найден" };
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").update({ status, reported_at: null }).eq("id", id);
  if (error) return { error: error.message };
  await revalidateReview(id);
  return {};
}

/** Жалоба не подтвердилась: отзыв остаётся, жалоба снимается */
export async function dismissReportAction(id: string): Promise<Result> {
  const { error: accessError } = await getStaffForAction();
  if (accessError) return { error: accessError };
  if (!isUuid(id)) return { error: "Отзыв не найден" };
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").update({ reported_at: null }).eq("id", id);
  if (error) return { error: error.message };
  await revalidateReview(id);
  return {};
}

/** Удалить насовсем — только администратор (спам, личные данные) */
export async function deleteReviewAdminAction(id: string): Promise<Result> {
  const { error: accessError } = await getStaffForAction({ admin: true });
  if (accessError) return { error: accessError };
  if (!isUuid(id)) return { error: "Отзыв не найден" };
  await revalidateReview(id);
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}
