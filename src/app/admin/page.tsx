import { getAdminStats, getAdminStores, getAdminProducts } from "@/lib/data/admin";

export default async function AdminPage() {
  const [stats, stores, products] = await Promise.all([
    getAdminStats(),
    getAdminStores(),
    getAdminProducts(),
  ]);

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
            {stores.map((store: any) => (
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

      {/* Товары */}
      <h2 className="text-xl font-semibold mb-4">Товары</h2>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">Фото</th>
              <th className="text-left px-4 py-3">Название</th>
              <th className="text-left px-4 py-3">Магазин</th>
              <th className="text-left px-4 py-3">Категория</th>
              <th className="text-left px-4 py-3">Цена</th>
              <th className="text-left px-4 py-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: any) => (
              <tr key={product.id} className="border-t hover:bg-stone-50">
                <td className="px-4 py-3">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-stone-100 rounded-lg" />
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3 text-stone-500">{product.stores?.name}</td>
                <td className="px-4 py-3 text-stone-500">{product.categories?.name}</td>
                <td className="px-4 py-3">{product.price.toLocaleString()} ₸</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.in_stock
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {product.in_stock ? "В наличии" : "Нет"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}