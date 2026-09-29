import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAdminProductAction } from "@/app/admin/(panel)/products/actions";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { requireStaff } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { getAdminProduct, getProductFormOptions } from "@/lib/data/admin-products";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function AdminProductPage({ params, searchParams }: PageProps) {
  await requireStaff();
  const { id } = await params;
  const { created } = await searchParams;
  if (!isUuid(id)) notFound();
  const [product, { stores, categories }] = await Promise.all([getAdminProduct(id), getProductFormOptions()]);
  if (!product) notFound();
  const store = stores.find((s) => s.id === product.store_id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/products" className="-mx-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
          ← Все товары
        </Link>
        <div className="flex flex-wrap gap-2">
          {store && (
            <Link href={`/admin/partners/${store.id}`} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-white">
              Партнёр: {store.name}
            </Link>
          )}
          <Link href={`/products/${product.id}`} target="_blank" className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-white">
            Открыть на сайте ↗
          </Link>
        </div>
      </div>
      {created && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Товар создан.</p>}
      <AdminProductForm
        action={saveAdminProductAction.bind(null, product.id)}
        product={product}
        stores={stores}
        categories={categories}
        submitLabel="Сохранить"
      />
    </div>
  );
}
