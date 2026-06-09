import { getAdminStats, getAdminStores, getAdminProducts } from "@/lib/data/admin";
import ProductsTable from "./_components/ProductsTable";

interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string | null;
  created_at: string;
  products: { count: number }[];
}

export default async function AdminPage() {
  const [stats, stores, products] = await Promise.all([
    getAdminStats(),
    getAdminStores(),
    getAdminProducts(),
  ]);

  // Приводим данные к типам, которые ожидает TypeScript
  const typedStores = (stores as unknown as Store[]) ?? [];
  const typedProducts = products ?? [];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Админ панель</h1>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-stone-500">Магазины</p>
          <p className="text-4xl font-bold mt-1">{stats.storesCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-stone-500">Товары</p>
          <p className="text-4xl font-bold mt-1">{stats.productsCount}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-stone-500">Категории</p>
          <p className="text-4xl font-bold mt-1">{stats.categoriesCount}</p>
        </div>
      </div>

      {/* Магазины */}
      <h2 className="text-xl font-semibold mb-4">Магазины</h2>
      <div className="bg-white rounded-xl border mb-10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">Название</th>
              <th className="text-left px-4 py-3">Город</th>
              <th className="text-left px-4 py-3">Адрес</th>
              <th className="text-left px-4 py-3">Телефон</th>
              <th className="text-left px-4 py-3">Товаров</th>
              <th className="text-left px-4 py-3">Дата</th>
            </tr>
          </thead>
          <tbody>
            {typedStores.map((store) => (
              <tr key={store.id} className="border-t hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{store.name}</td>
                <td className="px-4 py-3 text-stone-500">{store.city}</td>
                <td className="px-4 py-3 text-stone-500">{store.address}</td>
                <td className="px-4 py-3 text-stone-500">{store.phone ?? "—"}</td>
                <td className="px-4 py-3">{store.products?.[0]?.count ?? 0}</td>
                <td className="px-4 py-3 text-stone-500">
                  {new Date(store.created_at).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Интерактивная таблица товаров */}
      <h2 className="text-xl font-semibold mb-4">Товары</h2>
      <ProductsTable initialProducts={typedProducts} />
    </main>
  );
}