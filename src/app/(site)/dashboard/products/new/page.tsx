import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import { getCategories } from "@/lib/data/catalog";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Новый товар — ShopTour",
};

export default async function NewProductPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const store = await getStoreForOwner(user.id);
  if (!store) redirect("/auth/register");

  const categories = await getCategories();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
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
      <div className="mt-8">
        <ProductForm categories={categories} />
      </div>
    </main>
  );
}
