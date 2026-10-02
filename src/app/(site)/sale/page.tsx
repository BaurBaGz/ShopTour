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
import { formatProductCount } from "@/lib/utils/format";
import { getDiscountDaysLeft, getDiscountPercent } from "@/lib/utils/product";

export const metadata: Metadata = {
  title: "Скидки — ShopTour",
  description: "Все товары со скидкой в магазинах одежды вашего города",
};

type SalePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Вкладка «Скидки»: тот же каталог, но только товары с действующей скидкой
export default async function SalePage({ searchParams }: SalePageProps) {
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
  const chips = buildFilterChips(values, { categories: categoriesResult.data, stores: filterOptions.stores });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Скидки</h1>
        <p className="mt-1 text-sm text-stone-500">
          Акции магазинов и вещи со скидкой. Если у скидки есть срок — указано, до какого дня она действует.
        </p>
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
          <p className="mb-4 text-sm text-stone-500">{formatProductCount(products.length)} со скидкой</p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
          <p className="text-lg font-medium text-stone-800">
            {chips.length > 0 || section ? "Товаров со скидкой по этим условиям нет" : "Товаров со скидкой сейчас нет"}
          </p>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            {chips.length > 0 || section
              ? "Попробуйте другой раздел или сбросьте фильтры."
              : "Магазины добавляют скидки постоянно — загляните позже или посмотрите весь каталог."}
          </p>
          <Link
            href={chips.length > 0 ? "/sale" : "/catalog"}
            className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            {chips.length > 0 ? "Сбросить фильтры" : "Весь каталог"}
          </Link>
        </div>
      )}
    </main>
  );
}
