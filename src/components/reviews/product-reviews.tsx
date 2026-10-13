"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewItem } from "@/components/reviews/review-item";
import { Stars } from "@/components/reviews/stars";
import type { PublicReview, ReviewStats } from "@/lib/data/reviews";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";
import type { ReviewFit } from "@/types/database";

type ProductReviewsProps = {
  productId: string;
  storeId: string;
  stats: ReviewStats;
  productReviews: PublicReview[];
  storeReviews: PublicReview[];
  /** null — гость (предлагаем войти); иначе — свой отзыв, если уже есть */
  viewer: { name: string; mine: PublicReview | null } | null;
};

const FITS: ReviewFit[] = ["small", "true", "large"];

/** Отзывы в карточке товара: две вкладки — о товаре и о магазине — и форма своего отзыва */
export function ProductReviews({ productId, storeId, stats, productReviews, storeReviews, viewer }: ProductReviewsProps) {
  const t = useT();
  const r = t.reviews;
  const [tab, setTab] = useState<"product" | "store">("product");
  const [writing, setWriting] = useState(false);
  const closeForm = useCallback(() => setWriting(false), []);

  const fitTotal = stats.fit.small + stats.fit.true + stats.fit.large;
  const mine = viewer?.mine ?? null;
  const list = tab === "product" ? productReviews : storeReviews;
  // Свой отзыв показываем отдельно сверху — не дублируем его в списке
  const others = mine ? list.filter((review) => review.id !== mine.id) : list;
  const showMine = mine !== null && !writing && (tab === "product" || mine.store_rating !== null);

  const tabButton = (id: "product" | "store", text: string, count: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
      className={cn(
        "min-h-11 rounded-xl px-4 text-sm font-semibold transition",
        tab === id ? "bg-stone-900 text-white" : "text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
      )}
    >
      {text} <span className={tab === id ? "text-stone-300" : "text-stone-400"}>{count}</span>
    </button>
  );

  const back = `/products/${productId}#reviews`;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-16 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-title" className="text-2xl font-semibold tracking-tight text-stone-900">
          {r.title}
        </h2>
        {!writing &&
          (viewer ? (
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              {mine ? r.editMine : r.write}
            </button>
          ) : (
            <Link
              href={`/auth/login?next=${encodeURIComponent(back)}`}
              className="inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-stone-50"
            >
              {r.loginToWrite}
            </Link>
          ))}
      </div>

      {writing && viewer && (
        <div className="mt-4 max-w-3xl">
          <ReviewForm productId={productId} mine={mine} defaultName={viewer.name} onDone={closeForm} />
        </div>
      )}

      <div role="tablist" className="mt-5 flex flex-wrap gap-2">
        {tabButton("product", r.aboutProduct, stats.productCount)}
        {tabButton("store", r.aboutStore, stats.storeCount)}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Сводка: средняя оценка и «как сидит» */}
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200 lg:self-start">
          {tab === "product" ? (
            stats.productAvg !== null ? (
              <>
                <p className="text-3xl font-semibold text-stone-900">{stats.productAvg.toFixed(1)}</p>
                <Stars value={stats.productAvg} label={r.stars(Math.round(stats.productAvg))} className="mt-1 text-lg" />
                <p className="mt-1 text-sm text-stone-500">{r.count(stats.productCount)}</p>
                {stats.productOnlyExamples && <p className="mt-1 text-xs font-semibold text-amber-800">{t.example.ratings}</p>}
              </>
            ) : (
              <p className="text-sm text-stone-500">{r.noProductReviews}</p>
            )
          ) : stats.storeAvg !== null ? (
            <>
              <p className="text-3xl font-semibold text-stone-900">{stats.storeAvg.toFixed(1)}</p>
              <Stars value={stats.storeAvg} label={r.stars(Math.round(stats.storeAvg))} className="mt-1 text-lg" />
              <p className="mt-1 text-sm text-stone-500">{r.count(stats.storeCount)}</p>
              {stats.storeOnlyExamples && <p className="mt-1 text-xs font-semibold text-amber-800">{t.example.ratings}</p>}
            </>
          ) : (
            <p className="text-sm text-stone-500">{r.newStore}</p>
          )}

          {tab === "product" && fitTotal > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{r.fitTitle}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {FITS.map((f) => {
                  const pct = Math.round((stats.fit[f] / fitTotal) * 100);
                  return (
                    <li key={f} className="text-sm">
                      <div className="flex justify-between text-stone-700">
                        <span>{r.fit[f]}</span>
                        <span className="text-stone-500">{pct}%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-stone-800" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div role="tabpanel" className="flex flex-col gap-3">
          {showMine && mine && (
            <ReviewItem review={mine} mode={tab} t={t}>
              <p className="mt-2 text-xs font-semibold text-rose-600">{r.yourReview}</p>
              {mine.status === "hidden" && <p className="mt-1 text-xs text-stone-500">{r.hiddenNote}</p>}
            </ReviewItem>
          )}
          {others.map((review) => (
            <ReviewItem key={review.id} review={review} mode={tab} t={t} />
          ))}
          {others.length === 0 && !showMine && (
            <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-600">
              {tab === "product" ? r.noProductReviews : r.noStoreReviews} {r.beFirst}
            </p>
          )}
          {tab === "store" && stats.storeCount > storeReviews.length && (
            <Link href={`/stores/${storeId}#reviews`} className="text-sm font-medium text-rose-600 hover:text-rose-700">
              {r.allStoreReviews}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
