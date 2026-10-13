"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewItem } from "@/components/reviews/review-item";
import { ReviewPhotos } from "@/components/reviews/review-photos";
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
const STARS = [5, 4, 3, 2, 1] as const;
type Filter = "all" | "photos" | (typeof STARS)[number];

/** Отзывы в карточке товара: две вкладки — о товаре и о магазине — и форма своего отзыва */
export function ProductReviews({ productId, storeId, stats, productReviews, storeReviews, viewer }: ProductReviewsProps) {
  const t = useT();
  const r = t.reviews;
  const [tab, setTabState] = useState<"product" | "store">("product");
  const [filter, setFilter] = useState<Filter>("all");
  const setTab = (next: "product" | "store") => {
    setTabState(next);
    setFilter("all");
  };
  const [writing, setWriting] = useState(false);
  const closeForm = useCallback(() => setWriting(false), []);

  const fitTotal = stats.fit.small + stats.fit.true + stats.fit.large;
  const mine = viewer?.mine ?? null;
  const list = tab === "product" ? productReviews : storeReviews;
  const ratingOf = (review: PublicReview) => (tab === "product" ? review.product_rating : review.store_rating);
  const matches = (review: PublicReview) =>
    filter === "all" ? true : filter === "photos" ? review.photos.length > 0 : ratingOf(review) === filter;
  // Сколько отзывов на каждую оценку и с фото — для кнопок фильтра и полосок
  const starCounts = Object.fromEntries(STARS.map((n) => [n, list.filter((review) => ratingOf(review) === n).length])) as Record<number, number>;
  const rated = STARS.reduce((sum, n) => sum + starCounts[n], 0);
  const withPhotos = list.filter((review) => review.photos.length > 0).length;
  // Свой отзыв показываем отдельно сверху — не дублируем его в списке
  const others = (mine ? list.filter((review) => review.id !== mine.id) : list).filter(matches);
  const showMine = mine !== null && !writing && (tab === "product" || mine.store_rating !== null) && matches(mine);
  // Лента «Фото покупателей» — из отзывов о товаре
  const buyerPhotos = productReviews.flatMap((review) => review.photos.map((path) => ({ path, author: review.author_name }))).slice(0, 15);

  const chip = (id: Filter, text: string, count: number) => (
    <button
      key={String(id)}
      type="button"
      aria-pressed={filter === id}
      disabled={count === 0 && filter !== id}
      onClick={() => setFilter(id)}
      className={cn(
        "min-h-11 rounded-full px-3.5 text-sm font-medium transition disabled:opacity-40 sm:min-h-9",
        filter === id ? "bg-rose-600 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
      )}
    >
      {text} <span className={filter === id ? "text-rose-100" : "text-stone-400"}>{count}</span>
    </button>
  );

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

      {buyerPhotos.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-stone-700">
            📷 {r.buyerPhotos} <span className="font-normal text-stone-400">{buyerPhotos.length}</span>
          </p>
          <ReviewPhotos photos={buyerPhotos} size="lg" />
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

          {rated > 0 && (
            <ul className="mt-4 flex flex-col gap-1 border-t border-stone-100 pt-3">
              {STARS.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => setFilter(filter === n ? "all" : n)}
                    disabled={starCounts[n] === 0}
                    className="flex w-full items-center gap-2 rounded-lg py-0.5 text-xs text-stone-600 hover:text-stone-900 disabled:hover:text-stone-600"
                  >
                    <span className="w-6 shrink-0 text-left">{n} ★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <span className="block h-full rounded-full bg-amber-500" style={{ width: `${Math.round((starCounts[n] / rated) * 100)}%` }} />
                    </span>
                    <span className="w-6 shrink-0 text-right text-stone-400">{starCounts[n]}</span>
                  </button>
                </li>
              ))}
            </ul>
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
          {list.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label={r.title}>
              {chip("all", r.filterAll, list.length)}
              {STARS.map((n) => chip(n, r.starFilter(n), starCounts[n]))}
              {chip("photos", `📷 ${r.withPhotos}`, withPhotos)}
            </div>
          )}
          {showMine && mine && (
            <ReviewItem review={mine} mode={tab} t={t}>
              <p className="mt-2 text-xs font-semibold text-rose-600">{r.yourReview}</p>
              {mine.status === "hidden" && <p className="mt-1 text-xs text-stone-500">{r.hiddenNote}</p>}
            </ReviewItem>
          )}
          {others.map((review) => (
            <ReviewItem key={review.id} review={review} mode={tab} t={t} />
          ))}
          {others.length === 0 && !showMine && filter !== "all" && <p className="text-sm text-stone-500">{r.noMatch}</p>}
          {others.length === 0 && !showMine && filter === "all" && (
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
