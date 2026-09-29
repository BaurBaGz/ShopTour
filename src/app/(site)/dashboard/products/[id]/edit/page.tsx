import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import { getCategories } from "@/lib/data/catalog";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Редактировать товар — ShopTour",
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const store = await getStoreForOwner(user.id);
  if (!store) redirect("/auth/register");

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("store_id", store.id)
    .maybeSingle();

  if (!product) notFound();

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
        Редактировать товар
      </h1>
      <div className="mt-8">
        <ProductForm categories={categories} product={product} />
      </div>
    </main>
  );
}
