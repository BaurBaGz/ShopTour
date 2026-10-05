import Image from "next/image";
import Link from "next/link";
import type { DailyPoint, TopProduct } from "@/lib/data/analytics";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/utils/cn";

const numberFormat = new Intl.NumberFormat("ru-RU");
export const formatNumber = (n: number) => numberFormat.format(n);

const dayFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" });
export const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));

export async function StatCards({ cards }: { cards: { label: string; value: number; note?: string }[] }) {
  const c = (await getT()).cabinet.analytics;
  return (
    <section aria-label={c.totals} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm text-stone-500">{card.label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{formatNumber(card.value)}</p>
          {card.note && <p className="mt-1 text-xs text-stone-500">{card.note}</p>}
        </div>
      ))}
    </section>
  );
}

type Metric = "visitors" | "productViews";

/** Столбики по дням; подробности дня — при наведении или нажатии */
export async function DailyChart({ daily, metric, title }: { daily: DailyPoint[]; metric: Metric; title: string }) {
  const t = await getT();
  const c = t.cabinet.analytics;
  const metricLabel = metric === "visitors" ? c.visitors : c.productViews;
  const dayFormat = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "short", timeZone: "UTC" });
  const formatDay = (day: string) => dayFormat.format(new Date(`${day}T00:00:00Z`));
  const peak = Math.max(0, ...daily.map((p) => p[metric]));
  // Масштаб столбиков; на пустом графике делить на 0 нельзя
  const max = Math.max(1, peak);
  const middle = daily[Math.floor(daily.length / 2)];

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        <p className="text-xs text-stone-500">
          {c.byDay(metricLabel)}
          {peak > 0 ? c.peak(formatNumber(peak)) : c.noData}
        </p>
      </div>

      <div
        className={cn("mt-5 flex h-40 items-end", daily.length > 40 ? "gap-px" : "gap-1")}
        role="img"
        aria-label={`${c.byDay(metricLabel)}: ${daily.map((p) => `${formatDay(p.day)} — ${p[metric]}`).join(", ")}`}
      >
        {daily.map((point, index) => {
          const value = point[metric];
          // Подсказка у краёв графика не должна вылезать за экран
          const edge = index < daily.length * 0.2 ? "left-0" : index > daily.length * 0.8 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            <div key={point.day} tabIndex={0} className="group relative flex h-full min-w-0 flex-1 items-end outline-none">
              <div
                className={cn(
                  "w-full rounded-t-sm transition-colors group-hover:bg-rose-600 group-focus:bg-rose-600",
                  value > 0 ? "bg-rose-400" : "bg-stone-100",
                )}
                style={{ height: value > 0 ? `${Math.max(3, (value / max) * 100)}%` : "3px" }}
              />
              <div className={cn("pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-xl bg-stone-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus:block", edge)}>
                <p className="font-semibold">{formatDay(point.day)}</p>
                <p>{c.visitors}: {formatNumber(point.visitors)}</p>
                {point.pageViews > 0 && <p>{c.pageViews}: {formatNumber(point.pageViews)}</p>}
                <p>{c.productViews}: {formatNumber(point.productViews)}</p>
                <p>{c.favorites}: {formatNumber(point.favorites)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-stone-500">
        <span>{formatDay(daily[0].day)}</span>
        {daily.length > 2 && <span>{formatDay(middle.day)}</span>}
        <span>{formatDay(daily[daily.length - 1].day)}</span>
      </div>
    </section>
  );
}

export async function TopProductsTable({
  products,
  title,
  hrefFor,
  showStore = true,
}: {
  products: TopProduct[];
  title: string;
  hrefFor: (id: string) => string;
  showStore?: boolean;
}) {
  const c = (await getT()).cabinet.analytics;
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
      {products.length === 0 ? (
        <EmptyNote />
      ) : (
        <div className="-mx-5 mt-3 overflow-x-auto sm:-mx-6">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="text-xs text-stone-500">
              <tr>
                <th className="py-2 pl-5 pr-2 font-medium sm:px-6">{c.product}</th>
                <th className="px-2 py-2 text-right font-medium leading-tight sm:px-3">{c.views}</th>
                <th className="hidden px-3 py-2 text-right font-medium leading-tight sm:table-cell">{c.visitors}</th>
                <th className="py-2 pl-2 pr-5 text-right font-medium leading-tight sm:px-6">{c.favorites}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p, i) => (
                <tr key={p.id}>
                  <td className="w-full max-w-0 py-2.5 pl-5 pr-2 sm:px-6">
                    <Link href={hrefFor(p.id)} className="flex items-center gap-3 hover:text-rose-700">
                      <span className="hidden w-5 shrink-0 text-right text-xs tabular-nums text-stone-400 sm:inline">{i + 1}</span>
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                        {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 font-medium text-stone-900 sm:line-clamp-1">{p.name}</span>
                        {showStore && p.storeName && <span className="block truncate text-xs text-stone-500">{p.storeName}</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">{formatNumber(p.views)}</td>
                  <td className="hidden px-3 py-2.5 text-right tabular-nums text-stone-500 sm:table-cell">{formatNumber(p.visitors)}</td>
                  <td className="py-2.5 pl-2 pr-5 text-right tabular-nums sm:px-6">{formatNumber(p.favorites)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export async function EmptyNote({ text }: { text?: string }) {
  return <p className="mt-2 text-sm text-stone-500">{text ?? (await getT()).cabinet.analytics.emptyPeriod}</p>;
}

export async function PeriodTabs({ current, hrefFor }: { current: number; hrefFor: (days: number) => string }) {
  const c = (await getT()).cabinet.analytics;
  return (
    <nav aria-label={c.period} className="inline-flex rounded-xl border border-stone-200 bg-white p-1">
      {[7, 30, 90].map((days) => (
        <Link
          key={days}
          href={hrefFor(days)}
          scroll={false}
          aria-current={current === days ? "page" : undefined}
          className={cn(
            "inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium transition",
            current === days ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100",
          )}
        >
          {c.days(days)}
        </Link>
      ))}
    </nav>
  );
}
