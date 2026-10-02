import Link from "next/link";
import type { Promotion, PromotionWithStore } from "@/lib/data/promotions";
import { cn } from "@/lib/utils/cn";
import { formatUntil } from "@/lib/utils/product";

/** «до 5 ноября · осталось 2 дня» или «без срока» */
export function promotionDeadline(promotion: Pick<Promotion, "ends_on">): string {
  if (!promotion.ends_on) return "Без срока";
  const until = formatUntil(promotion.ends_on);
  return until ? until[0].toUpperCase() + until.slice(1) : "Закончилась";
}

/** Карточки акций магазинов над товарами на вкладке «Скидки» */
export function PromotionCards({ promotions }: { promotions: PromotionWithStore[] }) {
  if (promotions.length === 0) return null;
  return (
    <section aria-labelledby="promotions-title" className="mb-8">
      <h2 id="promotions-title" className="mb-3 text-lg font-semibold tracking-tight text-stone-900">
        Акции магазинов
      </h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {promotions.map((promotion) => (
          <Link
            key={promotion.id}
            href={promotion.stores ? `/s/${promotion.stores.slug}` : "/stores"}
            className="flex w-[80%] shrink-0 flex-col gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:border-rose-300 hover:bg-rose-100/70 sm:w-auto"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{promotion.stores?.name ?? "Магазин"}</p>
            <p className="text-base font-semibold leading-snug text-stone-900">{promotion.title}</p>
            {promotion.description && <p className="line-clamp-3 text-sm text-stone-700">{promotion.description}</p>}
            <p className="mt-auto pt-1 text-xs font-medium text-rose-700">{promotionDeadline(promotion)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Акции на витрине магазина и на странице товара */
export function StorePromotions({ promotions, className }: { promotions: Promotion[]; className?: string }) {
  if (promotions.length === 0) return null;
  return (
    <ul className={cn("flex flex-col gap-2", className)} aria-label="Акции магазина">
      {promotions.map((promotion) => (
        <li key={promotion.id} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-stone-900">
            <span className="mr-2 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Акция
            </span>
            {promotion.title}
          </p>
          {promotion.description && <p className="mt-1 text-sm text-stone-700">{promotion.description}</p>}
          <p className="mt-1 text-xs font-medium text-rose-700">{promotionDeadline(promotion)}</p>
        </li>
      ))}
    </ul>
  );
}
