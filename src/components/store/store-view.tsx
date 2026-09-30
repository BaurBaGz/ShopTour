import type { Metadata } from "next";
import { TrackView } from "@/components/analytics/track-view";
import { ProductCard } from "@/components/catalog/product-card";
import { StoreHero } from "@/components/store/store-hero";
import { BackLink } from "@/components/ui/back-link";
import { getProducts } from "@/lib/data/catalog";
import type { Store } from "@/lib/data/types";
import { getAvailableSizes } from "@/lib/utils/product";

export function storeMetadata(store: Store | null): Metadata {
  if (!store) return { title: "Магазин не найден — ShopTour" };
  return {
    title: `${store.name} — ShopTour`,
    description: store.description ?? `Магазин ${store.name}, ${store.city}`,
  };
}

/** Витрина магазина: /stores/<id> и короткий адрес /s/<slug> (для шапки Instagram) */
export async function StoreView({ store }: { store: Store }) {
  const id = store.id;
  const all = await getProducts({
    storeId: id,
    includeOutOfStock: true,
  });
  // Что можно купить — сначала, закончившееся — в конце витрины
  const soldOut = (p: (typeof all)[number]) => !p.in_stock || (p.sizes.length > 0 && getAvailableSizes(p).length === 0);
  const products = [...all.filter((p) => !soldOut(p)), ...all.filter(soldOut)];

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
