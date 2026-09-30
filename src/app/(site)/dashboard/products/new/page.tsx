import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import { getCategories } from "@/lib/data/catalog";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Новый товар — ShopTour",
};

type NewProductPageProps = { searchParams: Promise<{ added?: string }> };

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { added } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const store = await getStoreForOwner(user.id);
  if (!store) redirect("/auth/register");

  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-stone-500 hover:text-stone-900"
      >
        ← Назад в кабинет
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-stone-900">
        Новый товар
      </h1>
      <p className="mt-1 text-sm text-stone-500">{store.name}</p>
      {added && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Товар добавлен. Следующий:
        </p>
      )}
      <div className="mt-8">
        <ProductForm categories={categories} storeId={store.id} />
      </div>
    </main>
  );
}
