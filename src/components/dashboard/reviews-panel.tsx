"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { replyReviewAction, reportReviewAction } from "@/app/(cabinet)/dashboard/reviews-actions";
import { ReviewItem } from "@/components/reviews/review-item";
import type { PublicReview } from "@/lib/data/reviews";
import { useT } from "@/lib/i18n/client";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";

type CabinetReview = PublicReview & { reported_at: string | null };

const field =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const smallButton = "min-h-11 rounded-xl px-3 text-sm font-medium ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:opacity-60 sm:min-h-9";

/** Один отзыв в кабинете: ответ магазина и жалоба */
function CabinetReviewCard({ review }: { review: CabinetReview }) {
  const t = useT();
  const c = t.cabinet.reviews;
  const [mode, setMode] = useState<"idle" | "reply" | "report">("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const open = (next: "reply" | "report") => {
    setMode(next);
    setText(next === "reply" ? (review.store_reply ?? "") : "");
    setError(null);
  };

  const run = (action: () => Promise<{ error?: string; success?: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) return setError(result.error);
      if (result.success) showToast({ message: result.success });
      setMode("idle");
    });

  // Покупатель оценил и товар, и магазин — показываем обе оценки по очереди
  return (
    <ReviewItem review={review} mode={review.product_rating ? "product" : "store"} t={t}>
      {review.product_rating && review.store_rating && (
        <p className="mt-2 text-xs text-stone-500">
          {t.reviews.rateStore}: {"★".repeat(review.store_rating)}
          {"☆".repeat(5 - review.store_rating)}
        </p>
      )}
      {/* В режиме «магазин» название товара уже показано в самом отзыве */}
      {review.product_rating && review.product_id && review.product_name && (
        <p className="mt-1 text-xs text-stone-500">
          <Link href={`/products/${review.product_id}#reviews`} className="hover:text-rose-600">
            {t.reviews.item(review.product_name)}
          </Link>
        </p>
      )}
      {review.status === "hidden" && <p className="mt-2 text-xs font-medium text-stone-500">{c.hidden}</p>}
      {review.reported_at && review.status !== "hidden" && <p className="mt-2 text-xs font-medium text-amber-700">{c.reportedNote}</p>}

      {mode === "idle" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => open("reply")} className={cn(smallButton, "text-stone-800")}>
            {review.store_reply ? c.editReply : c.reply}
          </button>
          {!review.reported_at && review.status !== "hidden" && (
            <button type="button" onClick={() => open("report")} className={cn(smallButton, "text-stone-500")}>
              {c.report}
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={mode === "reply" ? 500 : 300}
            placeholder={mode === "reply" ? c.replyPlaceholder : c.reportPlaceholder}
            aria-label={mode === "reply" ? c.reply : c.report}
            className={field}
            autoFocus
          />
          {mode === "reply" && <p className="text-xs text-stone-500">{c.replyHint}</p>}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => (mode === "reply" ? replyReviewAction(review.id, text) : reportReviewAction(review.id, text)))}
              className="min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60 sm:min-h-9"
            >
              {pending ? c.saving : mode === "reply" ? c.saveReply : c.sendReport}
            </button>
            {mode === "reply" && review.store_reply && (
              <button type="button" disabled={pending} onClick={() => run(() => replyReviewAction(review.id, ""))} className={cn(smallButton, "text-red-700")}>
                {c.removeReply}
              </button>
            )}
            <button type="button" onClick={() => setMode("idle")} className={cn(smallButton, "text-stone-600")}>
              {c.cancel}
            </button>
          </div>
        </div>
      )}
    </ReviewItem>
  );
}

/** Отзывы о магазине в кабинете: фильтр «без ответа», ответы и жалобы */
export function ReviewsPanel({ reviews, summary }: { reviews: CabinetReview[]; summary: string | null }) {
  const c = useT().cabinet.reviews;
  const [filter, setFilter] = useState<"all" | "unanswered">("all");
  const unanswered = reviews.filter((review) => !review.store_reply && review.status === "published");
  const list = filter === "all" ? reviews : unanswered;

  return (
    <section aria-labelledby="reviews-title" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="reviews-title" className="text-xl font-semibold tracking-tight text-stone-900">
        {c.title}
      </h2>
      <p className="mt-1 text-sm text-stone-500">{c.intro}</p>
      {summary && <p className="mt-3 text-sm font-medium text-stone-800">{summary}</p>}

      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">{c.empty}</p>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            {(["all", "unanswered"] as const).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  "min-h-11 rounded-xl px-4 text-sm font-semibold transition sm:min-h-9",
                  filter === id ? "bg-stone-900 text-white" : "text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
                )}
              >
                {id === "all" ? `${c.filterAll} ${reviews.length}` : `${c.filterUnanswered} ${unanswered.length}`}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {list.map((review) => (
              <CabinetReviewCard key={review.id} review={review} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
