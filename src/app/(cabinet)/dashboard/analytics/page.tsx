import { DailyChart, PeriodTabs, StatCards, TopProductsTable } from "@/components/analytics/analytics-blocks";
import { requireCabinetPage } from "@/lib/auth/session";
import { getStoreAnalytics, parsePeriod } from "@/lib/data/analytics";

type PageProps = { searchParams: Promise<{ period?: string }> };

export default async function DashboardAnalyticsPage({ searchParams }: PageProps) {
  const { store } = await requireCabinetPage({ permission: "analytics" });
  const period = parsePeriod((await searchParams).period);
  const stats = await getStoreAnalytics(store.id, period);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          Сколько покупателей смотрят ваш магазин на ShopTour. Ваши собственные просмотры не считаются.
        </p>
        <PeriodTabs current={period} hrefFor={(d) => `/dashboard/analytics?period=${d}`} />
      </div>
      <StatCards
        cards={[
          { label: "Посетители", value: stats.totals.visitors, note: "смотрели магазин или товары" },
          { label: "Просмотры товаров", value: stats.totals.productViews },
          { label: "Страница магазина", value: stats.totals.storeViews, note: "открытий" },
          { label: "В избранное", value: stats.totals.favorites, note: "добавили ваши товары" },
        ]}
      />
      <DailyChart daily={stats.daily} metric="productViews" title="Просмотры по дням" />
      <TopProductsTable products={stats.topProducts} title="Популярные товары" hrefFor={(id) => `/products/${id}`} showStore={false} />
    </div>
  );
}
