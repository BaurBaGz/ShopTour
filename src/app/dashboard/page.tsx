import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { getCategories, getProductsWithError } from "@/lib/data/catalog";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { formatPrice } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Личный кабинет — ShopTour",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const store = await getStoreForOwner(user.id);
  if (!store) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-stone-900">
          Магазин не привязан
        </h1>
        <p className="mt-2 text-stone-500">
          Зарегистрируйте магазин или обратитесь в поддержку.
        </p>
        <Link
          href="/auth/register"
          className="mt-6 inline-block rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Регистрация
        </Link>
      </main>
    );
  }

  const [{ data: products, errorMessage }, categories] = await Promise.all([
    getProductsWithError({ storeId: store.id, includeOutOfStock: true }),
    getCategories(),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600">Личный кабинет</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
            {store.name}
          </h1>
          <p className="mt-1 text-stone-500">
            {store.city}, {store.address}
          </p>
          <Link
            href={`/stores/${store.id}`}
            className="mt-2 inline-block text-sm font-medium text-stone-600 hover:text-rose-600"
          >
            Открыть публичную страницу →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/products/new"
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
          >
            + Добавить товар
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Выйти
            </button>
          </form>
        </div>
      </div>

      {errorMessage && (
        <p className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="font-medium text-stone-800">Товаров пока нет</p>
          <p className="mt-2 text-sm text-stone-500">
            Добавьте первый товар в каталог.
          </p>
          <Link
            href="/dashboard/products/new"
            className="mt-6 inline-block rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Добавить товар
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">Товар</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Категория
                </th>
                <th className="px-4 py-3 font-medium sm:px-6">Цена</th>
                <th className="px-4 py-3 font-medium sm:px-6">Статус</th>
                <th className="px-4 py-3 font-medium sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-4 font-medium text-stone-900 sm:px-6">
                    {product.name}
                  </td>
                  <td className="hidden px-4 py-4 text-stone-500 sm:table-cell">
                    {categoryMap[product.category_id] ?? "—"}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span
                      className={
                        product.in_stock
                          ? "text-emerald-600"
                          : "text-stone-400"
                      }
                    >
                      {product.in_stock ? "В наличии" : "Нет"}
                    </span>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="font-medium text-rose-600 hover:text-rose-700"
                      >
                        Изменить
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
