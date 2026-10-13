import { RatingBadge } from "@/components/reviews/stars";
import type { ReviewStats, StoreTrust } from "@/lib/data/reviews";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils/cn";

function replyTime(minutes: number, t: Dictionary) {
  if (minutes < 60) return t.reviews.inMinutes(minutes);
  if (minutes < 48 * 60) return t.reviews.inHours(Math.round(minutes / 60));
  return t.reviews.inDays(Math.round(minutes / (24 * 60)));
}

type StoreTrustProps = {
  stats: ReviewStats;
  trust: StoreTrust | null;
  t: Dictionary;
  /** Куда ведёт оценка — к отзывам */
  reviewsHref: string;
  className?: string;
};

/** Оценка магазина и как он работает с бронями: «★ 4.8 · 12 отзывов», «отвечает за ~15 мин», «откладывает в 96%» */
export function StoreTrustLine({ stats, trust, t, reviewsHref, className }: StoreTrustProps) {
  const r = t.reviews;
  return (
    <ul className={cn("flex flex-col gap-1 text-sm text-stone-600", className)}>
      <li>
        {stats.storeAvg !== null ? (
          <a href={reviewsHref} className="hover:opacity-80">
            <RatingBadge avg={stats.storeAvg} countLabel={r.count(stats.storeCount)} starsLabel={r.stars(Math.round(stats.storeAvg))} />
          </a>
        ) : (
          <span className="text-stone-500">{r.newStore}</span>
        )}
      </li>
      {trust && (
        <>
          <li>⚡ {r.replies(replyTime(trust.replyMinutes, t))}</li>
          <li>✅ {r.kept(trust.keptPercent)}</li>
        </>
      )}
    </ul>
  );
}
