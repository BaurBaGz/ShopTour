import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { ProductForm } from "@/components/dashboard/product-form";
import { requireCabinetPage } from "@/lib/auth/session";
import { isUuid } from "@/lib/catalog-filters";
import { getCategories } from "@/lib/data/catalog";
import { createClient } from "@/lib/supabase/server";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const { store, permissions } = await requireCabinetPage({ permission: "products" });
  const c = (await getT()).cabinet.products;
  if (!isUuid(id)) notFound();

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
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/dashboard/products" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        {c.allProducts}
      </Link>
      <h2 className="text-xl font-semibold text-stone-900">{product.name}</h2>
      <ProductForm categories={categories} product={product} storeId={store.id} />
      {/* Удаление — отдельный доступ; без него товар убирают в черновик */}
      {permissions.includes("products_delete") && (
        <div className="border-t border-stone-200 pt-4">
          <DeleteProductButton productId={product.id} productName={product.name} />
        </div>
      )}
    </div>
  );
}
