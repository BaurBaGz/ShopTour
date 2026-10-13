import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/supabase/log-error";
import type { Database } from "@/types/database";

// Отзывы читает только сервер (у таблицы нет доступа из браузера): здесь же решаем, что показать.

export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

/** Отзыв для показа на сайте — без id автора и жалоб */
export type PublicReview = Pick<
  ReviewRow,
  | "id"
  | "product_id"
  | "product_name"
  | "author_name"
  | "outcome"
  | "store_rating"
  | "product_rating"
  | "fit"
  | "body"
  | "photos"
  | "verified"
  | "is_example"
  | "store_reply"
  | "store_reply_at"
  | "created_at"
  | "status"
>;

const PUBLIC_COLUMNS =
  "id, product_id, product_name, author_name, outcome, store_rating, product_rating, fit, body, photos, verified, is_example, store_reply, store_reply_at, created_at, status";

export type ReviewStats = {
  storeCount: number;
  storeAvg: number | null;
  /** Все отзывы с оценкой магазина — примеры (тогда рядом с оценкой пишем «примеры») */
  storeOnlyExamples: boolean;
  productCount: number;
  productAvg: number | null;
  productOnlyExamples: boolean;
  fit: { small: number; true: number; large: number };
};

const EMPTY_STATS: ReviewStats = { storeCount: 0, storeAvg: null, storeOnlyExamples: false, productCount: 0, productAvg: null, productOnlyExamples: false, fit: { small: 0, true: 0, large: 0 } };

/** Средние оценки магазина (и товара, если передан) — кэш на запрос */
export const getReviewStats = cache(async (storeId: string, productId: string | null = null): Promise<ReviewStats> => {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("review_stats", { p_store: storeId, p_product: productId });
  logSupabaseError("getReviewStats", error);
  const row = data?.[0];
  if (!row) return EMPTY_STATS;
  return {
    storeCount: row.store_count,
    storeAvg: row.store_avg === null ? null : Number(row.store_avg),
    storeOnlyExamples: row.store_count > 0 && row.store_examples === row.store_count,
    productCount: row.product_count,
    productAvg: row.product_avg === null ? null : Number(row.product_avg),
    productOnlyExamples: row.product_count > 0 && row.product_examples === row.product_count,
    fit: { small: row.fit_small, true: row.fit_true, large: row.fit_large },
  };
});

/** Отзывы о товаре: все, что относятся к нему */
export async function getProductReviews(productId: string, limit = 20): Promise<PublicReview[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  logSupabaseError("getProductReviews", error);
  return (data ?? []) as PublicReview[];
}

/** Отзывы о магазине: с оценкой магазина, по всем его товарам */
export async function getStoreReviews(storeId: string, limit = 20): Promise<PublicReview[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("store_id", storeId)
    .eq("status", "published")
    .not("store_rating", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  logSupabaseError("getStoreReviews", error);
  return (data ?? []) as PublicReview[];
}

/** Свой отзыв о товаре (в том числе скрытый модератором) — чтобы изменить или удалить */
export async function getMyReview(userId: string, productId: string): Promise<PublicReview | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  logSupabaseError("getMyReview", error);
  return (data as PublicReview | null) ?? null;
}

export type StoreTrust = { replyMinutes: number; keptPercent: number };

/** Не меньше 5 отвеченных броней за 90 дней — иначе цифры случайные и не показываем */
const TRUST_MIN_ANSWERED = 5;

export const getStoreTrust = cache(async (storeId: string): Promise<StoreTrust | null> => {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("store_trust", { p_store: storeId });
  logSupabaseError("getStoreTrust", error);
  const row = data?.[0];
  if (!row || row.answered < TRUST_MIN_ANSWERED || row.median_minutes === null) return null;
  return {
    replyMinutes: Math.max(1, row.median_minutes),
    keptPercent: Math.round((row.kept / row.answered) * 100),
  };
});

export type ProductPopularity = { reservations: number; viewers: number };

export async function getProductPopularity(productId: string): Promise<ProductPopularity> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("product_popularity", { p_product: productId });
  logSupabaseError("getProductPopularity", error);
  return { reservations: data?.[0]?.reservations ?? 0, viewers: data?.[0]?.viewers ?? 0 };
}

/** Кабинет магазина: все отзывы, включая скрытые, — новые сверху */
export async function getCabinetReviews(storeId: string): Promise<(PublicReview & { reported_at: string | null })[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select(`${PUBLIC_COLUMNS}, reported_at`)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(200);
  logSupabaseError("getCabinetReviews", error);
  return (data ?? []) as (PublicReview & { reported_at: string | null })[];
}

/** Отзывы без ответа магазина за 30 дней — число в меню кабинета */
export async function countUnansweredReviews(storeId: string): Promise<number> {
  const admin = createAdminClient();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("status", "published")
    .is("store_reply", null)
    .gte("created_at", monthAgo);
  logSupabaseError("countUnansweredReviews", error);
  return count ?? 0;
}

export type AdminReview = ReviewRow & { stores: { id: string; name: string } | null };

/** Админка: сначала жалобы, затем последние отзывы */
export async function getAdminReviews(filter: "reported" | "all" | "hidden"): Promise<AdminReview[]> {
  const admin = createAdminClient();
  let query = admin
    .from("reviews")
    .select("*, stores!reviews_store_id_fkey ( id, name )")
    .order(filter === "reported" ? "reported_at" : "created_at", { ascending: false })
    .limit(200);
  if (filter === "reported") query = query.not("reported_at", "is", null);
  if (filter === "hidden") query = query.eq("status", "hidden");
  const { data, error } = await query;
  logSupabaseError("getAdminReviews", error);
  return (data ?? []) as unknown as AdminReview[];
}

export async function countReportedReviews(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .not("reported_at", "is", null);
  logSupabaseError("countReportedReviews", error);
  return count ?? 0;
}
