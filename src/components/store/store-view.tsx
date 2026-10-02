import type { Metadata } from "next";
import { TrackView } from "@/components/analytics/track-view";
import { StorePromotions } from "@/components/promotions/promotion-list";
import { StoreHero } from "@/components/store/store-hero";
import { StoreProducts } from "@/components/store/store-products";
import { BackLink } from "@/components/ui/back-link";
import { getProducts } from "@/lib/data/catalog";
import { getStorePromotions } from "@/lib/data/promotions";
import type { Store } from "@/lib/data/types";
import { getT } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";
import { getAvailableSizes, getDiscountPercent } from "@/lib/utils/product";

export async function storeMetadata(store: Store | null): Promise<Metadata> {
  const t = await getT();
  if (!store) return { title: t.store.metaNotFound };
  // Постоянный адрес витрины — короткий /s/<slug>: его магазин ставит в Instagram
  return pageMeta({
    title: `${store.name} — ShopTour`,
    description:
      store.description?.slice(0, 200) ??
      t.store.metaDescription(store.name, store.city),
    path: `/s/${store.slug}`,
    image: `/og/store/${store.id}`,
  });
}

/** Витрина магазина: /stores/<id> и короткий адрес /s/<slug> (для шапки Instagram) */
export async function StoreView({ store }: { store: Store }) {
  const id = store.id;
  const t = await getT();
  const [all, promotions] = await Promise.all([
    getProducts({
      storeId: id,
      includeOutOfStock: true,
    }),
    getStorePromotions(id),
  ]);
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
          <BackLink fallbackHref="/catalog" />
        </div>
      </div>

      <StoreHero store={store} stats={stats} t={t} />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-label={t.store.productsLabel}>
        <StorePromotions promotions={promotions} className="mb-6 max-w-2xl" />
        {products.length > 0 ? (
          <StoreProducts products={products} />
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <p className="font-medium text-stone-800">{t.store.emptyTitle}</p>
            <p className="mt-2 text-sm text-stone-500">
              {t.store.emptyText}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
