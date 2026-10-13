"use server";

import { revalidatePath } from "next/cache";
import { requireStorePermission } from "@/lib/auth/session";
import { isUuid } from "@/lib/catalog-filters";
import { getT } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esc, notifyStaff } from "@/lib/telegram";

function revalidateStoreReviews(store: { id: string; slug: string }, productId: string | null) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/stores/${store.id}`);
  revalidatePath(`/s/${store.slug}`);
  revalidatePath("/admin/reviews");
  if (productId) revalidatePath(`/products/${productId}`);
}

/** Отзыв этого магазина — иначе чужой */
async function loadOwnReview(reviewId: string, storeId: string) {
  if (!isUuid(reviewId)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("reviews").select("id, store_id, product_id, product_name, author_name, body").eq("id", reviewId).maybeSingle();
  return data && data.store_id === storeId ? data : null;
}

/** Публичный ответ магазина на отзыв; пустой текст — убрать ответ */
export async function replyReviewAction(reviewId: string, reply: string): Promise<{ error?: string; success?: string }> {
  const c = (await getT()).cabinet.reviews;
  let store;
  try {
    ({ store } = await requireStorePermission("reviews"));
  } catch {
    return { error: c.errorNoAccess };
  }
  const review = await loadOwnReview(reviewId, store.id);
  if (!review) return { error: c.errorNotFound };

  const text = reply.trim();
  if (text && (text.length < 2 || text.length > 500)) return { error: c.errorReply };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reviews")
    .update({ store_reply: text || null, store_reply_at: text ? new Date().toISOString() : null })
    .eq("id", review.id);
  if (error) {
    console.error("[reviews] reply:", error.message);
    return { error: c.errorFailed };
  }
  revalidateStoreReviews(store, review.product_id);
  return { success: text ? c.replied : c.replyRemoved };
}

/** Жалоба магазина на отзыв: решает команда ShopTour в админке */
export async function reportReviewAction(reviewId: string, reason: string): Promise<{ error?: string; success?: string }> {
  const c = (await getT()).cabinet.reviews;
  let store;
  try {
    ({ store } = await requireStorePermission("reviews"));
  } catch {
    return { error: c.errorNoAccess };
  }
  const review = await loadOwnReview(reviewId, store.id);
  if (!review) return { error: c.errorNotFound };

  const text = reason.trim();
  if (!text || text.length > 300) return { error: c.errorReport };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reviews")
    .update({ reported_at: new Date().toISOString(), report_reason: text })
    .eq("id", review.id);
  if (error) {
    console.error("[reviews] report:", error.message);
    return { error: c.errorFailed };
  }

  await notifyStaff(
    [
      `⚠️ <b>Жалоба на отзыв</b> — ${esc(store.name)}`,
      review.product_name ? `Товар: ${esc(review.product_name)}` : null,
      `Автор: ${esc(review.author_name)}`,
      review.body ? `«${esc(review.body.slice(0, 300))}»` : null,
      `\nПричина: ${esc(text)}`,
      `\n<a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shoptour.kz"}/admin/reviews">Открыть в админке</a>`,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  );
  revalidateStoreReviews(store, review.product_id);
  return { success: c.reportSent };
}
