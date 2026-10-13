import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { requireCabinetPage } from "@/lib/auth/session";
import { getCabinetReviews, getReviewStats } from "@/lib/data/reviews";
import { getT } from "@/lib/i18n/server";

export default async function DashboardReviewsPage() {
  const { store } = await requireCabinetPage({ permission: "reviews" });
  const [reviews, stats, t] = await Promise.all([getCabinetReviews(store.id), getReviewStats(store.id), getT()]);
  const summary = stats.storeAvg !== null ? t.cabinet.reviews.summary(stats.storeAvg.toFixed(1), stats.storeCount) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <ReviewsPanel reviews={reviews} summary={summary} />
    </div>
  );
}
