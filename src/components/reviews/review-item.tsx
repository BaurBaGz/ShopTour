import Link from "next/link";
import { ReviewPhotos } from "@/components/reviews/review-photos";
import { Stars } from "@/components/reviews/stars";
import type { PublicReview } from "@/lib/data/reviews";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ReviewItemProps = {
  review: PublicReview;
  /** product — оценка товара и «как сидит»; store — оценка магазина и о каком товаре */
  mode: "product" | "store";
  t: Dictionary;
  children?: React.ReactNode;
};

export function reviewDate(iso: string, t: Dictionary) {
  return new Date(iso).toLocaleDateString(t.intl, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Almaty" });
}

/** Один отзыв: автор, оценка, как сходил, текст и ответ магазина */
export function ReviewItem({ review, mode, t, children }: ReviewItemProps) {
  const r = t.reviews;
  const stars = mode === "product" ? review.product_rating : review.store_rating;

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-semibold text-stone-900">{review.author_name}</p>
        {stars && <Stars value={stars} label={r.stars(stars)} />}
        <span className="text-xs text-stone-500">{reviewDate(review.created_at, t)}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
        {review.is_example && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">{t.example.review}</span>}
        {review.verified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">✓ {r.verified}</span>}
        {review.outcome && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">{r.outcome[review.outcome]}</span>}
        {mode === "product" && review.fit && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">{r.fit[review.fit]}</span>}
      </div>
      {mode === "store" && review.product_name && (
        <p className="mt-2 text-xs text-stone-500">
          {review.product_id ? (
            <Link href={`/products/${review.product_id}`} className="hover:text-rose-600">
              {r.item(review.product_name)}
            </Link>
          ) : (
            r.item(review.product_name)
          )}
        </p>
      )}
      {review.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{review.body}</p>}
      {review.photos?.length > 0 && (
        <ReviewPhotos photos={review.photos.map((path) => ({ path, author: review.author_name }))} className="mt-3" />
      )}
      {review.store_reply && (
        <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2.5 text-sm">
          <p className="text-xs font-semibold text-stone-500">{r.storeReply}</p>
          <p className="mt-0.5 whitespace-pre-line text-stone-700">{review.store_reply}</p>
        </div>
      )}
      {children}
    </article>
  );
}
