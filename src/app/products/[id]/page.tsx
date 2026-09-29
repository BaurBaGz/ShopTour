import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductPurchase } from "@/components/catalog/product-purchase";
import { StoreAvatar } from "@/components/store/store-avatar";
import { getProductById, getProducts } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils/format";
import { buildInstagramUrl } from "@/lib/utils/instagram";
import { getDiscountPercent } from "@/lib/utils/product";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: "Товар не найден — ShopTour" };
  }

  return {
    title: `${product.name} — ShopTour`,
    description:
      product.description ??
      `${product.name}${product.stores ? ` в магазине ${product.stores.name}` : ""}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
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
  const discount = getDiscountPercent(product);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Назад в каталог
      </Link>

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
              <div className="flex h-full items-center justify-center text-sm text-stone-400">
                Нет фото
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
                    alt={`${product.name}, фото ${index + 2}`}
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
            {product.categories && (
              <Link
                href={`/catalog?category=${product.categories.id}`}
                className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-200"
              >
                {product.categories.name}
              </Link>
            )}
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
                  <p className="text-lg text-stone-400 line-through">
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
                {product.in_stock ? "В наличии" : "Нет в наличии"}
              </span>
            </div>
            {discount && product.old_price && (
              <p className="mt-1 text-sm text-rose-600">
                Экономия {formatPrice(product.old_price - product.price)}
              </p>
            )}
          </div>

          <ProductPurchase product={product} contactPhone={contactPhone} />

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-stone-500">Описание</h2>
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
                  <p className="text-xs text-stone-500">Продаёт магазин</p>
                  <Link
                    href={`/stores/${store.id}`}
                    className="font-semibold text-stone-900 transition hover:text-rose-600"
                  >
                    {store.name}
                  </Link>
                  <p className="text-sm text-stone-500">
                    {store.city}, {store.address}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                {store.phone && (
                  <a
                    href={`tel:${store.phone.replace(/\s/g, "")}`}
                    className="rounded-full px-4 py-2.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    {store.phone}
                  </a>
                )}
                {store.instagram && (
                  <a
                    href={buildInstagramUrl(store.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full px-4 py-2.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
                  >
                    Instagram
                  </a>
                )}
              </div>

              <Link
                href={`/stores/${store.id}`}
                className="mt-4 inline-block text-sm font-medium text-rose-600 hover:text-rose-700"
              >
                Все товары магазина →
              </Link>
            </section>
          )}
        </div>
      </div>

      {store && moreFromStore.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight text-stone-900">
            Другие товары магазина {store.name}
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
