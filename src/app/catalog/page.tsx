import type { Metadata } from "next";
import { CategoryFilter } from "@/components/catalog/category-filter";
import { ProductCard } from "@/components/catalog/product-card";
import { SupabaseErrorBanner } from "@/components/catalog/supabase-error-banner";
import {
  getCategoriesWithError,
  getProductsWithError,
} from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Каталог — ShopTour",
  description: "Все товары от локальных магазинов одежды",
};

type CatalogPageProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category: categoryId, q: searchQuery } = await searchParams;

  const [categoriesResult, productsResult] = await Promise.all([
    getCategoriesWithError(),
    getProductsWithError({
      categoryId,
      search: searchQuery,
    }),
  ]);

  const categories = categoriesResult.data;
  const products = productsResult.data;
  const loadError =
    productsResult.errorMessage ?? categoriesResult.errorMessage;

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Каталог
        </h1>
        <p className="mt-2 text-stone-500">
          {searchQuery
            ? `Результаты по запросу «${searchQuery}»`
            : activeCategory
              ? activeCategory.name
              : "Все товары от магазинов города"}
        </p>
      </div>

      {loadError && (
        <SupabaseErrorBanner message={loadError} context="getProducts" />
      )}

      <div className="mb-8">
        <CategoryFilter
          categories={categories}
          activeCategoryId={categoryId}
          searchQuery={searchQuery}
        />
      </div>

      {products.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {products.length}{" "}
            {products.length === 1
              ? "товар"
              : products.length < 5
                ? "товара"
                : "товаров"}
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
              : searchQuery || categoryId
                ? "Попробуйте другой запрос или сбросьте фильтр категории."
                : "Добавьте товары в Supabase (Table Editor) или выполните demo_almaty_stores.sql."}
          </p>
        </div>
      )}
    </main>
  );
}
