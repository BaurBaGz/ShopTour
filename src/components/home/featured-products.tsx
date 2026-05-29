import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductWithRelations } from "@/lib/data/types";

type FeaturedProductsProps = {
  products: ProductWithRelations[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="border-t border-stone-200 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              Свежие поступления
            </h2>
            <p className="mt-2 text-stone-500">
              Недавно добавленные товары из каталога
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden text-sm font-medium text-rose-600 hover:text-rose-700 sm:inline"
          >
            Весь каталог →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/catalog"
            className="text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            Смотреть весь каталог →
          </Link>
        </div>
      </div>
    </section>
  );
}
