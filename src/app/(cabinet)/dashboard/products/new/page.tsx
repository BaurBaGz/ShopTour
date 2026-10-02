import Link from "next/link";
import { ProductForm } from "@/components/dashboard/product-form";
import { requireCabinetPage } from "@/lib/auth/session";
import { getCategories } from "@/lib/data/catalog";

type NewProductPageProps = { searchParams: Promise<{ added?: string }> };

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { added } = await searchParams;
  const { store } = await requireCabinetPage();
  const categories = await getCategories();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/dashboard/products" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        ← Все товары
      </Link>
      {added && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Товар добавлен. Следующий:
        </p>
      )}
      <ProductForm categories={categories} storeId={store.id} />
    </div>
  );
}
