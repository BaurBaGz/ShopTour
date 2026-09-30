import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrackView } from "@/components/analytics/track-view";
import { BackLink } from "@/components/ui/back-link";
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
      <TrackView type="store_view" storeId={store.id} />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <BackLink fallbackHref="/catalog" fallbackLabel="в каталог" />
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
