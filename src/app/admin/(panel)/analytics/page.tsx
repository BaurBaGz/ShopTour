import Link from "next/link";
import {
  DailyChart,
  EmptyNote,
  formatNumber,
  PeriodTabs,
  StatCards,
  TopProductsTable,
} from "@/components/analytics/analytics-blocks";
import { requireStaff } from "@/lib/auth/staff";
import { getAdminAnalytics, parsePeriod } from "@/lib/data/analytics";

type PageProps = { searchParams: Promise<{ period?: string }> };

const percent = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%` : "—";

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  await requireStaff();
  const days = parsePeriod((await searchParams).period);
  const data = await getAdminAnalytics(days);
  const { totals } = data;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-stone-500">
          Анонимная статистика посетителей. Сотрудники, владельцы магазинов на своих товарах и поисковые роботы не
          учитываются.
        </p>
        <PeriodTabs current={days} hrefFor={(d) => `/admin/analytics?period=${d}`} />
      </div>

      <StatCards
        cards={[
          { label: "Посетители", value: totals.visitors, note: "разных людей за период" },
          { label: "Просмотры страниц", value: totals.pageViews },
          { label: "Просмотры товаров", value: totals.productViews, note: `страниц магазинов: ${formatNumber(totals.storeViews)}` },
          { label: "В избранное", value: totals.favorites, note: "добавлений товаров" },
        ]}
      />

      <DailyChart daily={data.daily} metric="visitors" title="Посещаемость" />

      <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <TopProductsTable products={data.topProducts} title="Популярные товары" hrefFor={(id) => `/admin/products/${id}`} />

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Популярные магазины</h2>
          {data.topStores.length === 0 ? (
            <EmptyNote />
          ) : (
            <div className="-mx-5 mt-3 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead className="text-xs text-stone-500">
                  <tr>
                    <th className="py-2 pl-5 pr-2 font-medium sm:px-6">Магазин</th>
                    <th className="px-2 py-2 text-right font-medium leading-tight sm:px-3">Страница</th>
                    <th className="px-2 py-2 text-right font-medium leading-tight sm:px-3">Товары</th>
                    <th className="py-2 pl-2 pr-5 text-right font-medium leading-tight sm:px-6">В избранное</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.topStores.map((s, i) => (
                    <tr key={s.id}>
                      <td className="w-full max-w-0 py-2.5 pl-5 pr-2 sm:px-6">
                        <Link href={`/admin/partners/${s.id}`} className="flex min-h-10 items-center gap-3 font-medium text-stone-900 hover:text-rose-700">
                          <span className="hidden w-5 shrink-0 text-right text-xs tabular-nums text-stone-400 sm:inline">{i + 1}</span>
                          <span className="truncate">{s.name}</span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">{formatNumber(s.storeViews)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">{formatNumber(s.productViews)}</td>
                      <td className="py-2.5 pl-2 pr-5 text-right tabular-nums sm:px-6">{formatNumber(s.favorites)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-5 pt-3 text-xs text-stone-500 sm:px-6">
                «Страница» — открытия страницы магазина, «Товары» — просмотры его товаров.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Что ищут в каталоге</h2>
          {data.popularSearches.length === 0 ? (
            <EmptyNote text="Поисков за этот период не было." />
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {data.popularSearches.map((s) => (
                <li key={s.query} className="flex items-center justify-between gap-3 py-2">
                  <Link
                    href={`/catalog?q=${encodeURIComponent(s.query)}`}
                    target="_blank"
                    className="min-w-0 truncate font-medium text-stone-900 hover:text-rose-700"
                  >
                    {s.query}
                  </Link>
                  <span className="shrink-0 tabular-nums text-stone-500">
                    {formatNumber(s.searches)} {s.zero === s.searches && <span className="text-amber-700">· ничего не нашлось</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Искали, но не нашли</h2>
          <p className="mt-1 text-sm text-stone-500">Подсказка, каких товаров не хватает в каталоге.</p>
          {data.zeroSearches.length === 0 ? (
            <EmptyNote text="Все поиски что-то находили." />
          ) : (
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {data.zeroSearches.map((s) => (
                <li key={s.query} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate font-medium text-stone-900">{s.query}</span>
                  <span className="shrink-0 rounded-lg bg-amber-50 px-2 py-0.5 tabular-nums text-amber-800">
                    {formatNumber(s.zero)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Баннеры</h2>
        {data.banners.length === 0 ? (
          <EmptyNote text="Баннеров нет." />
        ) : (
          <div className="-mx-5 mt-3 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead className="text-xs text-stone-500">
                <tr>
                  <th className="py-2 pl-5 pr-2 font-medium sm:px-6">Баннер</th>
                  <th className="px-2 py-2 text-right font-medium leading-tight sm:px-3">Показы</th>
                  <th className="px-2 py-2 text-right font-medium leading-tight sm:px-3">Нажатия</th>
                  <th className="py-2 pl-2 pr-5 text-right font-medium leading-tight sm:px-6">Нажимают</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.banners.map((b) => (
                  <tr key={b.id}>
                    <td className="w-full max-w-0 py-2.5 pl-5 pr-2 sm:px-6">
                      <Link href={`/admin/banners/${b.id}`} className="flex min-h-10 items-center gap-2 font-medium text-stone-900 hover:text-rose-700">
                        <span className="truncate">{b.title}</span>
                        {!b.isActive && (
                          <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                            выключен
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">{formatNumber(b.views)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums sm:px-3">{formatNumber(b.clicks)}</td>
                    <td className="py-2.5 pl-2 pr-5 text-right tabular-nums sm:px-6">{percent(b.clicks, b.views)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 pt-3 text-xs text-stone-500 sm:px-6">
              «Нажимают» — доля показов, после которых нажали кнопку или ссылку баннера.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
