import Link from "next/link";
import { ProductsTable, type ProductFilter } from "@/components/admin/products-table";
import { requireStaff } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { getAdminProducts, getProductFormOptions } from "@/lib/data/admin-products";

const FILTER_IDS: ProductFilter[] = ["all", "in-stock", "sold-out", "hidden", "discounted", "no-photo"];

type PageProps = { searchParams: Promise<{ filter?: string; store?: string }> };

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const staff = await requireStaff();
  const { filter, store } = await searchParams;
  const [rows, { stores, categories }] = await Promise.all([getAdminProducts(), getProductFormOptions()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-stone-500">Отметьте товары, чтобы скрыть, уценить или удалить сразу несколько. Цену можно поправить кликом.</p>
        <Link href={`/admin/products/new${store && isUuid(store) ? `?store=${store}` : ""}`} className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600">
          + Добавить товар
        </Link>
      </div>
      <ProductsTable
        rows={rows}
        stores={stores}
        categories={categories}
        initialFilter={FILTER_IDS.find((f) => f === filter) ?? "all"}
        initialStore={store && isUuid(store) ? store : undefined}
        canDelete={staff.role === "admin"}
      />
    </div>
  );
}
