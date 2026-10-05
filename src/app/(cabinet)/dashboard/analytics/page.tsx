import { getT } from "@/lib/i18n/server";
import { DailyChart, PeriodTabs, StatCards, TopProductsTable } from "@/components/analytics/analytics-blocks";
import { requireCabinetPage } from "@/lib/auth/session";
import { StoreValueBlock } from "@/components/analytics/store-value";
import { getStoreAnalytics, getStoreValue, parsePeriod } from "@/lib/data/analytics";

type PageProps = { searchParams: Promise<{ period?: string }> };

export default async function DashboardAnalyticsPage({ searchParams }: PageProps) {
  const { store } = await requireCabinetPage({ permission: "analytics" });
  const c = (await getT()).cabinet.analytics;
  const period = parsePeriod((await searchParams).period);
  const [stats, value] = await Promise.all([getStoreAnalytics(store.id, period), getStoreValue(store.id, period)]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {c.intro}
        </p>
        <PeriodTabs current={period} hrefFor={(d) => `/dashboard/analytics?period=${d}`} />
      </div>
      <StoreValueBlock value={value} />
      <StatCards
        cards={[
          { label: c.visitors, value: stats.totals.visitors, note: c.visitorsNote },
          { label: c.productViews, value: stats.totals.productViews },
          { label: c.storePage, value: stats.totals.storeViews, note: c.storePageNote },
          { label: c.favorites, value: stats.totals.favorites, note: c.favoritesNote },
        ]}
      />
      <DailyChart daily={stats.daily} metric="productViews" title={c.viewsByDay} />
      <TopProductsTable products={stats.topProducts} title={c.popular} hrefFor={(id) => `/products/${id}`} showStore={false} />
    </div>
  );
}
