import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { StoreHero } from "@/components/store/store-hero";
import { getProducts, getStoreById } from "@/lib/data/catalog";

type StorePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    return { title: "Магазин не найден — ShopTour" };
  }

  return {
    title: `${store.name} — ShopTour`,
    description: store.description ?? `Магазин ${store.name}, ${store.city}`,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    notFound();
  }

  const products = await getProducts({
    storeId: id,
    includeOutOfStock: true,
  });

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад в каталог
        </Link>
      </div>

      <StoreHero store={store} productCount={products.length} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900">
          Товары магазина
        </h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <p className="font-medium text-stone-800">Пока нет товаров</p>
            <p className="mt-2 text-sm text-stone-500">
              Магазин ещё не добавил позиции в каталог.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
