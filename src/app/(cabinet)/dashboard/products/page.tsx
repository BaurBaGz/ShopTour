import Link from "next/link";
import { ProductsManager, type ManagedProduct } from "@/components/dashboard/products-manager";
import { requireCabinetPage } from "@/lib/auth/session";
import { getCategories, getProductsWithError } from "@/lib/data/catalog";

export default async function DashboardProductsPage() {
  const { store } = await requireCabinetPage();
  const [{ data: products, errorMessage }, categories] = await Promise.all([
    getProductsWithError({ storeId: store.id, includeOutOfStock: true, includeHidden: true }),
    getCategories(),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const managed: ManagedProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    images: p.images ?? [],
    sizes: p.sizes ?? [],
    size_stock: p.size_stock,
    in_stock: p.in_stock,
    is_hidden: p.is_hidden,
    is_draft: p.is_draft ?? false,
    category: categoryMap[p.category_id] ?? null,
  }));
  const withPhoto = managed.filter((p) => p.images.length > 0).length;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 pb-20 sm:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">Продали — нажмите «−» у размера. Закончилось всё — «Снять с продажи».</p>
        <Link
          href="/dashboard/products/new"
          className="hidden min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 sm:inline-flex"
        >
          + Добавить товар
        </Link>
      </div>

      {errorMessage && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

      {managed.length > 0 && withPhoto < 5 && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
          Добавьте хотя бы 5 товаров с фото — так витрина выглядит живой и её чаще открывают. Сейчас с фото: {withPhoto}.
        </p>
      )}

      {managed.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-stone-800">Товаров пока нет</p>
          <p className="mt-2 text-sm text-stone-500">Сфотографируйте вещь, укажите цену и размеры — это займёт минуту.</p>
          <Link
            href="/dashboard/products/new"
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-6 text-sm font-semibold text-white"
          >
            Добавить первый товар
          </Link>
        </div>
      ) : (
        <ProductsManager products={managed} />
      )}

      {/* На телефоне кнопка добавления всегда под рукой */}
      <Link
        href="/dashboard/products/new"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-30 flex min-h-12 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 sm:hidden"
      >
        + Добавить товар
      </Link>
    </div>
  );
}
