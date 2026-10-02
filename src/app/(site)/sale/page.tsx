import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ProductCard } from "@/components/catalog/product-card";
import { PromotionCards } from "@/components/promotions/promotion-list";
import { SectionTabs } from "@/components/catalog/section-tabs";
import { SupabaseErrorBanner } from "@/components/catalog/supabase-error-banner";
import { parseSection, SECTION_AUDIENCES, SECTION_COOKIE } from "@/lib/audience";
import { buildFilterChips, buildFilterHref, parsePrice, parseSort, readFilterValues } from "@/lib/catalog-filters";
import { getCatalogFilterOptions, getCategoriesWithError, getProductsWithError } from "@/lib/data/catalog";
import { getActivePromotions } from "@/lib/data/promotions";
import { parseNear, parseWalk } from "@/lib/near";
import { getT } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";
import { getDiscountDaysLeft, getDiscountPercent } from "@/lib/utils/product";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return pageMeta({ title: `${t.sale.title} — ShopTour`, description: t.meta.saleDescription, path: "/sale" });
}

type SalePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Вкладка «Скидки»: тот же каталог, но только товары с действующей скидкой
export default async function SalePage({ searchParams }: SalePageProps) {
  const t = await getT();
  const values = readFilterValues(await searchParams);
  const sort = parseSort(values.sort);
  const near = parseNear(values.near);
  const section =
    values.for === "all" ? null : (parseSection(values.for) ?? parseSection((await cookies()).get(SECTION_COOKIE)?.value));

  const [categoriesResult, productsResult, filterOptions, promotions] = await Promise.all([
    getCategoriesWithError(),
    getProductsWithError({
      categoryId: values.category,
      storeId: values.store,
      size: values.size,
      search: values.q,
      minPrice: parsePrice(values.min),
      maxPrice: parsePrice(values.max),
      sort,
      near,
      walkMinutes: parseWalk(values.walk),
      audiences: section ? SECTION_AUDIENCES[section] : null,
      onSale: true,
    }),
    getCatalogFilterOptions(),
    getActivePromotions(),
  ]);

  const products = productsResult.data;
  // Без выбранной сортировки: сначала скидки, которые скоро закончатся, затем бессрочные — от большей к меньшей
  if (!sort && !near) {
    products.sort((a, b) => {
      const leftA = getDiscountDaysLeft(a);
      const leftB = getDiscountDaysLeft(b);
      if (leftA !== null && leftB !== null) return leftA - leftB;
      if (leftA !== null) return -1;
      if (leftB !== null) return 1;
      return (getDiscountPercent(b) ?? 0) - (getDiscountPercent(a) ?? 0);
    });
  }

  const loadError = productsResult.errorMessage ?? categoriesResult.errorMessage;
  const chips = buildFilterChips(values, { categories: categoriesResult.data, stores: filterOptions.stores }, t);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{t.sale.title}</h1>
        <p className="mt-1 text-sm text-stone-500">{t.sale.subtitle}</p>
      </div>

      {loadError && <SupabaseErrorBanner message={loadError} context="getProducts" />}

      <div className="mb-4">
        <SectionTabs current={section} />
      </div>

      <div className="mb-5">
        <CatalogFilters
          key={buildFilterHref("/sale", values)}
          values={values}
          categories={categoriesResult.data}
          options={filterOptions}
          basePath="/sale"
          showNear
        />
      </div>

      {chips.length > 0 && (
        <div className="mb-6">
          <ActiveFilterChips chips={chips} keepOnReset={["sort", "for"]} />
        </div>
      )}

      {/* Акции относятся к магазину целиком — с фильтрами по товарам их не показываем */}
      {chips.length === 0 && <PromotionCards promotions={promotions} />}

      {products.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-stone-500">{t.sale.count(products.length)}</p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
          <p className="text-lg font-medium text-stone-800">
            {chips.length > 0 || section ? t.sale.emptyFilteredTitle : t.sale.emptyTitle}
          </p>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            {chips.length > 0 || section ? t.sale.emptyFilteredText : t.sale.emptyText}
          </p>
          <Link
            href={chips.length > 0 ? "/sale" : "/catalog"}
            className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            {chips.length > 0 ? t.catalog.resetFilters : t.sale.wholeCatalog}
          </Link>
        </div>
      )}
    </main>
  );
}
