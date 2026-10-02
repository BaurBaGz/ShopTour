import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { TrackView } from "@/components/analytics/track-view";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { FoundStores } from "@/components/catalog/found-stores";
import { SectionTabs } from "@/components/catalog/section-tabs";
import { isKidsSection, parseSection, SECTION_AUDIENCES, SECTION_COOKIE } from "@/lib/audience";
import { ProductCard } from "@/components/catalog/product-card";
import { PromoCarousel } from "@/components/catalog/promo-carousel";
import { SupabaseErrorBanner } from "@/components/catalog/supabase-error-banner";
import {
  buildFilterChips,
  buildFilterHref,
  parsePrice,
  parseSort,
  readFilterValues,
} from "@/lib/catalog-filters";
import {
  getActiveBanners,
  getCatalogFilterOptions,
  getCategoryIdsForAudiences,
  getCategoriesWithError,
  getProductsWithError,
  searchStores,
} from "@/lib/data/catalog";
import { parseNear, parseWalk } from "@/lib/near";
import { getT } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return pageMeta({ title: `${t.catalog.title} — ShopTour`, description: t.meta.catalogDescription, path: "/catalog" });
}

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const t = await getT();
  const values = readFilterValues(await searchParams);
  const sort = parseSort(values.sort);
  const minPrice = parsePrice(values.min);
  const maxPrice = parsePrice(values.max);
  const near = parseNear(values.near);
  // Раздел «Для кого»: из адреса, иначе — запомненный выбор покупателя
  const section =
    values.for === "all" ? null : (parseSection(values.for) ?? parseSection((await cookies()).get(SECTION_COOKIE)?.value));
  const audiences = section ? SECTION_AUDIENCES[section] : null;

  const [categoriesResult, productsResult, filterOptions, banners, foundStores, sectionCategoryIds] = await Promise.all([
    getCategoriesWithError(),
    getProductsWithError({
      categoryId: values.category,
      storeId: values.store,
      size: values.size,
      search: values.q,
      minPrice,
      maxPrice,
      sort,
      near,
      walkMinutes: parseWalk(values.walk),
      audiences,
    }),
    getCatalogFilterOptions(),
    getActiveBanners(),
    values.q ? searchStores(values.q) : Promise.resolve([]),
    audiences ? getCategoryIdsForAudiences(audiences) : Promise.resolve(null),
  ]);

  // В разделе — только категории, где есть его товары (выбранную оставляем, чтобы чипса не пропала)
  const categories = sectionCategoryIds
    ? categoriesResult.data.filter((c) => sectionCategoryIds.has(c.id) || c.id === values.category)
    : categoriesResult.data;
  const products = productsResult.data;
  const loadError = productsResult.errorMessage ?? categoriesResult.errorMessage;

  const chips = buildFilterChips(
    values,
    {
      categories,
      stores: filterOptions.stores,
    },
    t,
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {t.catalog.title}
        </h1>
      </div>

      {values.q?.trim() && !loadError && (
        <TrackView type="search" query={values.q} results={products.length} />
      )}

      {loadError && (
        <SupabaseErrorBanner message={loadError} context="getProducts" />
      )}

      {/* Идея сервиса — пока человек ещё ничего не ищет; с фильтрами баннеры не отодвигают результаты */}
      {chips.length === 0 && banners.length > 0 && (
        <div className="mb-4">
          <PromoCarousel banners={banners} />
        </div>
      )}

      <div className="mb-4">
        <SectionTabs current={section} saleLink />
      </div>

      <div className="mb-5">
        {/* key: при переходе по чипсам форма пересоздаётся с актуальными значениями */}
        <CatalogFilters
          key={buildFilterHref("/catalog", values)}
          values={values}
          categories={categories}
          options={filterOptions}
          showNear
        />
      </div>

      {chips.length > 0 && (
        <div className="mb-6">
          <ActiveFilterChips chips={chips} keepOnReset={["sort", "for"]} />
        </div>
      )}

      <FoundStores stores={foundStores} near={near} t={t} />

      {products.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {t.catalog.productCount(products.length)}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
          <p className="text-lg font-medium text-stone-800">
            {isKidsSection(section) && chips.length === 0 ? t.catalog.emptyKidsTitle : t.catalog.emptyTitle}
          </p>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            {loadError
              ? t.catalog.emptyErrorText
              : isKidsSection(section) && chips.length === 0
                ? t.catalog.emptyKidsText
                : near && values.walk
                  ? t.catalog.emptyNearText(values.walk)
                  : chips.length > 0
                    ? t.catalog.emptyFilteredText
                    : t.catalog.emptyNoProductsText}
          </p>
          {chips.length > 0 && (
            <Link
              href="/catalog"
              className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              {t.catalog.resetFilters}
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
