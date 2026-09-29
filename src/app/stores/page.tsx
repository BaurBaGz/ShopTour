import type { Metadata } from "next";
import Link from "next/link";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { StoresExplorer } from "@/components/map/stores-explorer";
import {
  buildFilterChips,
  buildFilterHref,
  parsePrice,
  parseSort,
  readFilterValues,
} from "@/lib/catalog-filters";
import {
  getCatalogFilterOptions,
  getCategories,
  getProducts,
  getStoresWithCoords,
} from "@/lib/data/catalog";
import { formatProductCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Магазины на карте — ShopTour",
  description: "Локальные магазины одежды на карте города",
};

type StoresMapPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatStoreCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} магазине`;
  return `${count} магазинах`;
}

export default async function StoresMapPage({ searchParams }: StoresMapPageProps) {
  // store — выбранный на карте магазин, а не фильтр
  const { store: selectedStoreId, ...values } = readFilterValues(await searchParams);

  const [allStores, products, categories, filterOptions] = await Promise.all([
    getStoresWithCoords(),
    getProducts({
      categoryId: values.category,
      size: values.size,
      search: values.q,
      minPrice: parsePrice(values.min),
      maxPrice: parsePrice(values.max),
      sort: parseSort(values.sort),
    }),
    getCategories(),
    getCatalogFilterOptions(),
  ]);

  const chips = buildFilterChips(values, { categories });
  const hasFilters = chips.length > 0;

  // С фильтрами на карте только магазины, где есть подходящие товары
  const storeIdsWithProducts = new Set(products.map((p) => p.store_id));
  const stores = hasFilters
    ? allStores.filter((s) => storeIdsWithProducts.has(s.id))
    : allStores;
  const productsOnMap = products.filter((p) =>
    stores.some((s) => s.id === p.store_id),
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Магазины на карте
        </h1>
        <p className="mt-2 text-stone-500">
          Выберите магазин на карте — ниже откроются его товары
        </p>
      </div>

      <div className="mb-6">
        {/* key: при переходе по чипсам форма пересоздаётся с актуальными значениями */}
        <CatalogFilters
          key={buildFilterHref("/stores", values)}
          values={values}
          categories={categories}
          options={filterOptions}
          basePath="/stores"
          showStoreFilter={false}
          preserveKeys={["store"]}
        />
      </div>

      {hasFilters && (
        <div className="mb-6 flex flex-col gap-3">
          <ActiveFilterChips chips={chips} keepOnReset={["sort", "store"]} />
          <p className="text-sm text-stone-500">
            {stores.length > 0
              ? `Найдено ${formatProductCount(productsOnMap.length)} в ${formatStoreCount(stores.length)}`
              : "Подходящих товаров нет ни в одном магазине"}
          </p>
        </div>
      )}

      {stores.length > 0 ? (
        <StoresExplorer
          stores={stores}
          allStores={allStores}
          products={productsOnMap}
          initialStoreId={selectedStoreId}
          showCounts={hasFilters}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
          <p className="text-lg font-medium text-stone-800">
            {hasFilters
              ? "Ни в одном магазине нет подходящих товаров"
              : "Пока нет магазинов с адресом на карте"}
          </p>
          {hasFilters && (
            <Link
              href="/stores"
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
