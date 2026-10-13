import { botMessages } from "@/lib/i18n/bot";
import { createAdminClient } from "@/lib/supabase/admin";
import { esc, sendMessage } from "@/lib/telegram";
import type { ReviewRow } from "@/lib/data/reviews";

// Отзывы: общие правила и уведомление магазину в Telegram

export const REVIEW_OUTCOMES = ["bought", "tried", "visited", "online"] as const;
export const REVIEW_FITS = ["small", "true", "large"] as const;

export function starsText(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shoptour.kz";
}

/** Новый отзыв — магазину в Telegram, чтобы успел ответить */
export async function notifyStoreReview(review: ReviewRow) {
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("store_notifications")
    .select("telegram_chat_id, locale")
    .eq("store_id", review.store_id)
    .maybeSingle();
  if (!link?.telegram_chat_id) return;
  const m = botMessages(link.locale).review;

  const lines = [
    m.title(esc(review.product_name ?? "")),
    review.product_rating ? m.product(starsText(review.product_rating)) : null,
    review.store_rating ? m.store(starsText(review.store_rating)) : null,
    m.author(esc(review.author_name)),
    review.body ? `\n«${esc(review.body.slice(0, 600))}»` : null,
    `\n<a href="${siteUrl()}/dashboard/reviews">${m.reply}</a>`,
  ];
  await sendMessage(link.telegram_chat_id, lines.filter((line) => line !== null).join("\n"));
}
