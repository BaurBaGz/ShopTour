import type { Metadata } from "next";
import { StoresExplorer } from "@/components/map/stores-explorer";
import { getProducts, getStoresWithCoords } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Магазины на карте — ShopTour",
  description: "Локальные магазины одежды на карте города",
};

type StoresMapPageProps = {
  searchParams: Promise<{ store?: string | string[] }>;
};

export default async function StoresMapPage({ searchParams }: StoresMapPageProps) {
  const { store } = await searchParams;
  const [stores, products] = await Promise.all([
    getStoresWithCoords(),
    getProducts(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Магазины на карте
        </h1>
        <p className="mt-2 text-stone-500">
          Выберите магазин на карте — ниже откроются его товары
        </p>
      </div>

      {stores.length > 0 ? (
        <StoresExplorer
          stores={stores}
          products={products}
          initialStoreId={Array.isArray(store) ? store[0] : store}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
          <p className="text-lg font-medium text-stone-800">
            Пока нет магазинов с адресом на карте
          </p>
        </div>
      )}
    </main>
  );
}
