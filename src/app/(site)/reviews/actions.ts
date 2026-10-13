"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/catalog-filters";
import { getT } from "@/lib/i18n/server";
import { isReviewPhotoPath, MAX_REVIEW_PHOTOS } from "@/lib/review-photo-url";
import { prepareReviewPhoto, removeReviewPhotos, ReviewPhotoError, uploadReviewPhotos } from "@/lib/review-photos";
import { notifyStoreReview, REVIEW_FITS, REVIEW_OUTCOMES } from "@/lib/reviews";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewFit, ReviewOutcome } from "@/types/database";

export type ReviewState = { error?: string; success?: string };

function rating(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

function pick<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function revalidateReviewPages(productId: string, store: { id: string; slug: string }) {
  revalidatePath(`/products/${productId}`);
  revalidatePath(`/stores/${store.id}`);
  revalidatePath(`/s/${store.slug}`);
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin/reviews");
}

/**
 * Отзыв о товаре и магазине. Оставить может любой вошедший пользователь — один на товар,
 * повторная отправка меняет свой отзыв. Пометка «бронировал» — если была бронь в этом магазине.
 */
export async function saveReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const r = (await getT()).reviews;
  const user = await getSessionUser();
  if (!user) return { error: r.errorLogin };

  const productId = String(formData.get("productId") ?? "");
  const authorName = String(formData.get("authorName") ?? "").trim().replace(/\s+/g, " ");
  const body = String(formData.get("body") ?? "").trim() || null;
  const productRating = rating(formData.get("productRating"));
  const storeRating = rating(formData.get("storeRating"));
  const outcome: ReviewOutcome | null = pick(formData.get("outcome"), REVIEW_OUTCOMES);
  const fit: ReviewFit | null = pick(formData.get("fit"), REVIEW_FITS);

  if (!isUuid(productId)) return { error: r.errorUnavailable };
  if (!productRating && !storeRating) return { error: r.errorRating };
  if (!authorName || authorName.length > 40) return { error: r.errorName };
  if (body && body.length > 1000) return { error: r.errorBody };

  // Фото: какие из уже загруженных оставить и новые файлы
  const keep = formData.getAll("keepPhoto").map(String).filter(isReviewPhotoPath);
  const files = formData.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
  if (keep.length + files.length > MAX_REVIEW_PHOTOS) return { error: r.errorPhotoCount(MAX_REVIEW_PHOTOS) };

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, name, is_hidden, is_draft, store:stores!products_store_id_fkey ( id, slug, status )")
    .eq("id", productId)
    .maybeSingle();
  const store = (product?.store ?? null) as { id: string; slug: string; status: string } | null;
  if (!product || !store || store.status !== "published" || product.is_hidden || product.is_draft) {
    return { error: r.errorUnavailable };
  }

  const fields = {
    author_name: authorName,
    outcome,
    store_rating: storeRating,
    product_rating: productRating,
    fit,
    body,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("reviews")
    .select("id, photos")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  // Оставить можно только свои прежние фото этого отзыва
  const kept = keep.filter((path) => existing?.photos.includes(path));

  if (!existing) {
    // От спама: не больше 5 новых отзывов в час и 20 в сутки с одного аккаунта
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent } = await admin.from("reviews").select("created_at").eq("user_id", user.id).gte("created_at", dayAgo);
    if ((recent ?? []).length >= 20 || (recent ?? []).filter((x) => x.created_at >= hourAgo).length >= 5) {
      return { error: r.errorTooMany };
    }
  }

  let uploaded: string[] = [];
  try {
    const prepared = await Promise.all(files.map(prepareReviewPhoto));
    uploaded = await uploadReviewPhotos(user.id, prepared);
  } catch (error) {
    if (error instanceof ReviewPhotoError) return { error: error.reason === "size" ? r.errorPhotoSize : r.errorPhotoType };
    console.error("[reviews] upload:", error instanceof Error ? error.message : error);
    return { error: r.errorFailed };
  }
  const photos = [...kept, ...uploaded];

  if (existing) {
    const { error } = await admin.from("reviews").update({ ...fields, photos }).eq("id", existing.id);
    if (error) {
      console.error("[reviews] update:", error.message);
      await removeReviewPhotos(uploaded);
      return { error: r.errorFailed };
    }
    await removeReviewPhotos(existing.photos.filter((path) => !photos.includes(path)));
    revalidateReviewPages(productId, store);
    return { success: r.updated };
  }

  const { count: reservations } = await admin
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("store_id", store.id);

  const { data: created, error } = await admin
    .from("reviews")
    .insert({
      ...fields,
      photos,
      store_id: store.id,
      product_id: product.id,
      product_name: product.name,
      user_id: user.id,
      verified: (reservations ?? 0) > 0,
    })
    .select("*")
    .single();
  if (error || !created) {
    console.error("[reviews] insert:", error?.message);
    await removeReviewPhotos(uploaded);
    return { error: r.errorFailed };
  }

  await notifyStoreReview(created);
  revalidateReviewPages(productId, store);
  return { success: r.published };
}

/** Удалить свой отзыв */
export async function deleteReviewAction(reviewId: string): Promise<{ error?: string }> {
  const r = (await getT()).reviews;
  const user = await getSessionUser();
  if (!user) return { error: r.errorLogin };
  if (!isUuid(reviewId)) return { error: r.errorFailed };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("product_id, photos, store:stores!reviews_store_id_fkey ( id, slug )");
  if (error || !data?.length) return { error: r.errorFailed };
  await removeReviewPhotos(data[0].photos ?? []);
  const store = data[0].store as unknown as { id: string; slug: string } | null;
  if (data[0].product_id && store) revalidateReviewPages(data[0].product_id, store);
  return {};
}
