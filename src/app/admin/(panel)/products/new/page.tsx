import Link from "next/link";
import { saveAdminProductAction } from "@/app/admin/(panel)/products/actions";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { requireStaff } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { getProductFormOptions } from "@/lib/data/admin-products";

type PageProps = { searchParams: Promise<{ store?: string }> };

export default async function AdminNewProductPage({ searchParams }: PageProps) {
  await requireStaff();
  const { store } = await searchParams;
  const { stores, categories } = await getProductFormOptions();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link href="/admin/products" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        ← Все товары
      </Link>
      <AdminProductForm
        action={saveAdminProductAction.bind(null, null)}
        stores={stores}
        categories={categories}
        defaultStoreId={store && isUuid(store) ? store : undefined}
        submitLabel="Создать товар"
      />
    </div>
  );
}
