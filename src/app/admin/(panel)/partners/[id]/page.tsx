import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePartnerAction } from "@/app/admin/(panel)/partners/actions";
import { LocationPicker } from "@/components/admin/location-picker";
import { DeletePartner, OwnerPanel, PartnerStatusControl } from "@/components/admin/partner-controls";
import { PartnerForm } from "@/components/admin/partner-form";
import { PartnerStatusBadge } from "@/components/admin/partner-status";
import { requireStaff } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { getPartner } from "@/lib/data/admin-partners";
import { formatPrice } from "@/lib/utils/format";
import { getAvailableSizes, getDiscountPercent } from "@/lib/utils/product";
import { getStoreColor, getStoreInitial } from "@/lib/utils/store-color";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function AdminPartnerPage({ params, searchParams }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const { created } = await searchParams;
  if (!isUuid(id)) notFound();
  const partner = await getPartner(id);
  if (!partner) notFound();
  const { store, ownerEmail, products, stats } = partner;
  const hasLocation = store.latitude !== null && store.longitude !== null;

  const statCards = [
    { label: "Товаров", value: stats.total },
    { label: "В наличии", value: stats.inStock },
    { label: "Со скидкой", value: stats.discounted },
    { label: "Без фото", value: stats.withoutPhoto, warn: stats.withoutPhoto > 0 },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Link href="/admin/partners" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        ← Все партнёры
      </Link>

      {created && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Партнёр создан черновиком. Поставьте точку на карте и опубликуйте, когда всё готово.
        </p>
      )}

      <header className="flex flex-wrap items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white"
          style={{ backgroundColor: getStoreColor(store.id) }}
          aria-hidden
        >
          {store.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            getStoreInitial(store.name)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-stone-900">{store.name}</h2>
            <PartnerStatusBadge status={store.status} />
          </div>
          <p className="text-stone-500">
            {store.city}, {store.address}
          </p>
        </div>
        <Link
          href={`/stores/${store.id}`}
          target="_blank"
          className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-white"
        >
          Открыть на сайте ↗
        </Link>
      </header>

      <section aria-label="Товары партнёра — сводка" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">{c.label}</p>
            <p className={c.warn ? "mt-1 text-2xl font-semibold tabular-nums text-amber-700" : "mt-1 text-2xl font-semibold tabular-nums text-stone-900"}>
              {c.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <PartnerForm action={updatePartnerAction.bind(null, store.id)} store={store} storeId={store.id} submitLabel="Сохранить" allowLogoUrl />
          <OwnerPanel storeId={store.id} ownerEmail={ownerEmail} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <PartnerStatusControl storeId={store.id} status={store.status} hasLocation={hasLocation} />
          <LocationPicker
            storeId={store.id}
            latitude={store.latitude}
            longitude={store.longitude}
            address={`${store.city}, ${store.address}`}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-labelledby="products-title">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 id="products-title" className="text-lg font-semibold text-stone-900">Товары</h2>
          <span className="flex flex-wrap gap-2">
            <Link href={`/admin/products?store=${store.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
              В разделе «Товары»
            </Link>
            <Link href={`/admin/products/new?store=${store.id}`} className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-3 text-sm font-semibold text-white hover:bg-rose-600">
              + Товар
            </Link>
          </span>
        </div>
        {products.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone-500">Товаров пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-stone-50 text-left text-stone-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Товар</th>
                  <th className="px-5 py-3 font-medium">Категория</th>
                  <th className="px-5 py-3 font-medium">Цена</th>
                  <th className="px-5 py-3 font-medium">Наличие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => {
                  const available = getAvailableSizes({ ...p });
                  const discount = getDiscountPercent(p);
                  const soldOut = !p.in_stock || (p.sizes.length > 0 && available.length === 0);
                  return (
                    <tr key={p.id}>
                      <td className="px-5 py-3">
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-rose-700">
                          <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                            {p.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                            )}
                          </span>
                          <span className="font-medium text-stone-900">{p.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {/* Связь «товар → категория» — один объект (типы Supabase без описания связей видят массив) */}
                        {(p.categories as unknown as { name: string } | null)?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {formatPrice(p.price)}
                        {discount && <span className="ml-2 text-xs font-semibold text-rose-700">−{discount}%</span>}
                      </td>
                      <td className="px-5 py-3">
                        {soldOut ? (
                          <span className="text-amber-700">нет в наличии</span>
                        ) : (
                          <span className="text-stone-600">{p.sizes.length ? available.join(", ") : "в наличии"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {staff.role === "admin" && <DeletePartner storeId={store.id} storeName={store.name} productCount={stats.total} />}
    </div>
  );
}
