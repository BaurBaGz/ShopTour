import type { Metadata } from "next";
import Link from "next/link";
import {
  CatalogFilters,
  type CatalogFilterValues,
} from "@/components/catalog/catalog-filters";
import { ProductCard } from "@/components/catalog/product-card";
import { SupabaseErrorBanner } from "@/components/catalog/supabase-error-banner";
import {
  getCatalogFilterOptions,
  getCategoriesWithError,
  getProductsWithError,
  type ProductSort,
} from "@/lib/data/catalog";
import { formatPrice, formatProductCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Каталог — ShopTour",
  description: "Все товары от локальных магазинов одежды",
};

type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTER_KEYS = ["q", "category", "store", "size", "min", "max", "sort"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Берём по одному значению на параметр; неверные id отбрасываем, иначе Postgres вернёт ошибку
function readFilterValues(
  params: Record<string, string | string[] | undefined>,
): CatalogFilterValues {
  const values: CatalogFilterValues = {};
  for (const key of FILTER_KEYS) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value) values[key] = value;
  }
  if (values.category && !UUID_RE.test(values.category)) delete values.category;
  if (values.store && !UUID_RE.test(values.store)) delete values.store;
  return values;
}

const SORTS: ProductSort[] = ["new", "price_asc", "price_desc"];

function parsePrice(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function buildHref(values: CatalogFilterValues): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const values = readFilterValues(await searchParams);
  const sort = SORTS.find((s) => s === values.sort);
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

  // Выбранные фильтры — чипсы с крестиком (ссылка без этого параметра)
  const chips: { label: string; href: string }[] = [];
  const without = (...keys: (keyof CatalogFilterValues)[]) =>
    buildHref(
      Object.fromEntries(
        Object.entries(values).filter(
          ([key]) => !keys.includes(key as keyof CatalogFilterValues),
        ),
      ),
    );

  if (values.q?.trim()) {
    chips.push({ label: `«${values.q.trim()}»`, href: without("q") });
  }
  const category = categories.find((c) => c.id === values.category);
  if (category) chips.push({ label: category.name, href: without("category") });
  const store = filterOptions.stores.find((s) => s.id === values.store);
  if (store) chips.push({ label: store.name, href: without("store") });
  if (values.size) {
    chips.push({ label: `Размер ${values.size}`, href: without("size") });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const label =
      minPrice !== undefined && maxPrice !== undefined
        ? `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}`
        : minPrice !== undefined
          ? `от ${formatPrice(minPrice)}`
          : `до ${formatPrice(maxPrice!)}`;
    chips.push({ label, href: without("min", "max") });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Каталог
        </h1>
        <p className="mt-2 text-stone-500">Все товары от магазинов города</p>
      </div>

      {loadError && (
        <SupabaseErrorBanner message={loadError} context="getProducts" />
      )}

      <div className="mb-6">
        {/* key: при переходе по чипсам форма пересоздаётся с актуальными значениями */}
        <CatalogFilters
          key={buildHref(values)}
          values={values}
          categories={categories}
          options={filterOptions}
        />
      </div>

      {chips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="group inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-2 text-sm text-stone-700 ring-1 ring-stone-200 transition hover:ring-stone-300"
              aria-label={`Убрать фильтр: ${chip.label}`}
            >
              {chip.label}
              <span className="text-stone-400 group-hover:text-rose-600" aria-hidden>
                ✕
              </span>
            </Link>
          ))}
          {chips.length > 1 && (
            <Link
              href={buildHref({ sort: values.sort })}
              className="px-2 text-sm font-medium text-stone-500 hover:text-stone-900"
            >
              Сбросить все
            </Link>
          )}
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
