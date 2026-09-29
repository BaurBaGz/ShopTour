import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
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
  getCatalogFilterOptions,
  getCategoriesWithError,
  getProductsWithError,
} from "@/lib/data/catalog";
import { formatProductCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Каталог — ShopTour",
  description: "Все товары от локальных магазинов одежды",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const values = readFilterValues(await searchParams);
  const sort = parseSort(values.sort);
  const minPrice = parsePrice(values.min);
  const maxPrice = parsePrice(values.max);

  const [categoriesResult, productsResult, filterOptions] = await Promise.all([
    getCategoriesWithError(),
    getProductsWithError({
      categoryId: values.category,
      storeId: values.store,
      size: values.size,
      search: values.q,
      minPrice,
      maxPrice,
      sort,
    }),
    getCatalogFilterOptions(),
  ]);

  const categories = categoriesResult.data;
  const products = productsResult.data;
  const loadError = productsResult.errorMessage ?? categoriesResult.errorMessage;

  const chips = buildFilterChips(values, {
    categories,
    stores: filterOptions.stores,
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Каталог
        </h1>
        <p className="mt-2 hidden text-stone-500 sm:block">Все товары от магазинов города</p>
      </div>

      {loadError && (
        <SupabaseErrorBanner message={loadError} context="getProducts" />
      )}

      {/* Идея сервиса — пока человек ещё ничего не ищет; с фильтрами баннеры не отодвигают результаты */}
      {chips.length === 0 && (
        <div className="mb-6">
          <PromoCarousel />
        </div>
      )}

      <div className="mb-6">
        {/* key: при переходе по чипсам форма пересоздаётся с актуальными значениями */}
        <CatalogFilters
          key={buildFilterHref("/catalog", values)}
          values={values}
          categories={categories}
          options={filterOptions}
        />
      </div>

      {chips.length > 0 && (
        <div className="mb-6">
          <ActiveFilterChips chips={chips} keepOnReset={["sort"]} />
        </div>
      )}

      {products.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {formatProductCount(products.length)}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
          <p className="text-lg font-medium text-stone-800">Товары не найдены</p>
          <p className="mt-2 max-w-sm text-sm text-stone-500">
            {loadError
              ? "Исправьте ошибку выше — данные в базе есть, но запрос не доходит до Supabase."
              : chips.length > 0
                ? "Попробуйте изменить или сбросить фильтры."
                : "Добавьте товары в Supabase (Table Editor) или выполните demo_almaty_stores.sql."}
          </p>
          {chips.length > 0 && (
            <Link
              href="/catalog"
              className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Сбросить фильтры
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
