import { pageMeta } from "@/lib/seo";
import { StorePromotions } from "@/components/promotions/promotion-list";
import { getStorePromotions } from "@/lib/data/promotions";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecordRecent } from "@/components/account/record-recent";
import { TrackView } from "@/components/analytics/track-view";
import { BackLink } from "@/components/ui/back-link";
import { DistanceFromMe } from "@/components/catalog/distance-from-me";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductPurchase } from "@/components/catalog/product-purchase";
import { ShowOnMapLink } from "@/components/store/show-on-map-link";
import { StoreAvatar } from "@/components/store/store-avatar";
import { AUDIENCE_COLOR, AUDIENCE_SECTION } from "@/lib/audience";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/auth/session";
import { getProductById, getProducts } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils/format";
import { buildInstagramUrl } from "@/lib/utils/instagram";
import { formatDiscountDeadline, getDiscountPercent } from "@/lib/utils/product";

type ProductPageProps = {
  params: Promise<{ id: string }>;
  /** reserve — вернулись после входа: сразу открыть бронь (значение — размер или «1») */
  searchParams: Promise<{ reserve?: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  const t = await getT();
  if (!product) {
    return { title: t.productPage.metaNotFound };
  }

  const where = product.stores ? t.productPage.metaWhere(product.stores.name, product.stores.city) : "";
  return pageMeta({
    title: `${product.name} — ShopTour`,
    // Цена и магазин — первым делом: это видно в карточке ссылки
    description: `${formatPrice(product.price)}${where}. ${product.description?.slice(0, 160) ?? t.productPage.metaDefault}`,
    path: `/products/${product.id}`,
    image: `/og/product/${product.id}`,
  });
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const store = product.stores;
  const [mainImage, ...extraImages] = product.images ?? [];

  const moreFromStore = store
    ? (await getProducts({ storeId: store.id, limit: 5 }))
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  const contactPhone = store?.whatsapp ?? store?.phone ?? null;

  // Бронь — только для вошедших; имя и телефон подставляем из аккаунта
  const user = await getSessionUser();
  const meta = user?.user_metadata ?? {};
  const viewer = user
    ? {
        name: [meta.name, meta.full_name].find((v): v is string => typeof v === "string" && v.trim() !== "") ?? "",
        phone: typeof meta.contact_phone === "string" ? meta.contact_phone : "",
      }
    : null;
  const reserveOnOpen = (await searchParams).reserve?.slice(0, 20) ?? null;
  const discount = getDiscountPercent(product);
  const t = await getT();
  const promotions = store ? await getStorePromotions(store.id) : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <TrackView type="product_view" productId={product.id} />
      <RecordRecent productId={product.id} />
      <BackLink fallbackHref="/catalog" />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone-100">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-stone-500">
                {t.product.noPhoto}
              </div>
            )}
          </div>

          {extraImages.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {extraImages.map((src, index) => (
                <div
                  key={src}
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100"
                >
                  <Image
                    src={src}
                    alt={t.productPage.photoAlt(product.name, index + 2)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 33vw, 16vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.categories && (
                <Link
                  href={`/catalog?category=${product.categories.id}`}
                  className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
                >
                  {product.categories.name}
                </Link>
              )}
              {/* Для кого: унисекс поясняем, чтобы женская модель на фото не сбивала мужчин */}
              <Link
                href={`/catalog?for=${AUDIENCE_SECTION[product.audience] ?? "all"}`}
                className={`inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold transition hover:bg-stone-200 ${AUDIENCE_COLOR[product.audience]}`}
              >
                {t.audience[product.audience].label}
              </Link>
              <span className="text-xs text-stone-500">{t.audience[product.audience].hint}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p
                className={
                  discount
                    ? "text-2xl font-bold text-rose-600"
                    : "text-2xl font-bold text-stone-900"
                }
              >
                {formatPrice(product.price)}
              </p>
              {discount && product.old_price && (
                <>
                  <p className="text-lg text-stone-500 line-through">
                    {formatPrice(product.old_price)}
                  </p>
                  <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                    −{discount}%
                  </span>
                </>
              )}
              <span
                className={
                  product.in_stock
                    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                    : "rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500"
                }
              >
                {product.in_stock ? t.purchase.inStock : t.product.outOfStock}
              </span>
            </div>
            {discount && product.old_price && (
              <p className="mt-1 text-sm text-rose-700">
                {t.productPage.saving(formatPrice(product.old_price - product.price))}
                {formatDiscountDeadline(product, t) ? ` · ${formatDiscountDeadline(product, t)}` : ""}
              </p>
            )}
          </div>

          <StorePromotions promotions={promotions} />

          <ProductPurchase
            product={product}
            contactPhone={contactPhone}
            viewer={viewer}
            reserveOnOpen={reserveOnOpen}
          />

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-stone-500">{t.productPage.description}</h2>
              <p className="whitespace-pre-line leading-relaxed text-stone-700">
                {product.description}
              </p>
            </div>
          )}

          {store && (
            <section className="rounded-3xl border border-stone-200/80 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                  <StoreAvatar store={store} sizes="56px" textClassName="text-2xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stone-500">{t.productPage.soldBy}</p>
                  <Link
                    href={`/stores/${store.id}`}
                    className="font-semibold text-stone-900 transition hover:text-rose-600"
                  >
                    {store.name}
                  </Link>
                  <ShowOnMapLink
                    storeId={store.id}
                    productId={product.id}
                    className="text-sm text-stone-500 hover:text-rose-600"
                  >
                    {store.city}, {store.address}
                  </ShowOnMapLink>
                  <DistanceFromMe store={store} className="mt-0.5" />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                {store.phone && (
                  <a
                    href={`tel:${store.phone.replace(/\s/g, "")}`}
                    className="inline-flex min-h-11 items-center rounded-full px-4 py-2.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    {store.phone}
                  </a>
                )}
                {store.instagram && (
                  <a
                    href={buildInstagramUrl(store.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full px-4 py-2.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    Instagram
                  </a>
                )}
              </div>

              <Link
                href={`/stores/${store.id}`}
                className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-rose-600 hover:text-rose-700"
              >
                {t.productPage.allStoreProducts}
              </Link>
            </section>
          )}
        </div>
      </div>

      {store && moreFromStore.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-stone-900">
            {t.productPage.otherProducts(store.name)}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {moreFromStore.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
