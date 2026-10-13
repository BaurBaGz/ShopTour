import Link from "next/link";
import { AdminReviewsList } from "@/components/admin/reviews-list";
import { requireStaff } from "@/lib/auth/staff";
import { countReportedReviews, getAdminReviews } from "@/lib/data/reviews";
import { cn } from "@/lib/utils/cn";

type Filter = "reported" | "all" | "hidden";
const FILTERS: [Filter, string][] = [
  ["reported", "Жалобы"],
  ["all", "Все"],
  ["hidden", "Скрытые"],
];

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const staff = await requireStaff();
  const reported = await countReportedReviews();
  const requested = (await searchParams).filter;
  // Без выбора: есть жалобы — сразу они, иначе все отзывы
  const filter: Filter = requested === "reported" || requested === "all" || requested === "hidden" ? requested : reported > 0 ? "reported" : "all";
  const reviews = await getAdminReviews(filter);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Отзывы</h1>
      <p className="mt-1 text-sm text-stone-500">
        Отзыв может оставить любой вошедший покупатель. Скрытый отзыв видят только автор и магазин. Магазины жалуются из кабинета — жалобы приходят сюда и в Telegram.
      </p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Фильтр отзывов">
        {FILTERS.map(([id, label]) => (
          <Link
            key={id}
            href={`/admin/reviews?filter=${id}`}
            className={cn(
              "inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition",
              filter === id ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {label}
            {id === "reported" && reported > 0 && <span className="ml-1.5 rounded-full bg-rose-600 px-1.5 text-xs text-white">{reported}</span>}
          </Link>
        ))}
      </nav>
      <AdminReviewsList reviews={reviews} canDelete={staff.role === "admin"} />
    </div>
  );
}
