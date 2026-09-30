import type { Metadata } from "next";
import { TrackView } from "@/components/analytics/track-view";
import { StoreHero } from "@/components/store/store-hero";
import { StoreProducts } from "@/components/store/store-products";
import { BackLink } from "@/components/ui/back-link";
import { getProducts } from "@/lib/data/catalog";
import type { Store } from "@/lib/data/types";
import { getAvailableSizes, getDiscountPercent } from "@/lib/utils/product";

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
  const stats = {
    total: products.length,
    available: products.filter((p) => !soldOut(p)).length,
    discounted: products.filter((p) => getDiscountPercent(p)).length,
  };

  return (
    <main>
      <TrackView type="store_view" storeId={store.id} />
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <BackLink fallbackHref="/catalog" fallbackLabel="в каталог" />
        </div>
      </div>

      <StoreHero store={store} stats={stats} />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-label="Товары магазина">
        {products.length > 0 ? (
          <StoreProducts products={products} />
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
