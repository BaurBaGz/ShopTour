"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteProductAction } from "../actions";

// Описываем форму данных товара, чтобы TypeScript не ругался
interface Product {
  id: string;
  name: string;
  images: string[] | null;
  price: number;
  in_stock: boolean;
  stores: { name: string } | null;
  categories: { name: string } | null;
}

export default function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Вы уверены, что хотите удалить товар "${name}"?`)) return;

    setDeletingId(id);
    const { error } = await deleteProductAction(id);

    if (error) {
      alert("Ошибка при удалении: " + error.message);
      setDeletingId(null);
    } else {
      setProducts(products.filter((p) => p.id !== id));
      setDeletingId(null);
    }
  }

  return (
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
            <th className="text-right px-4 py-3">Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t hover:bg-stone-50">
              <td className="px-4 py-3">
                {product.images?.[0] ? (
                  <div className="relative w-12 h-12">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-stone-100 rounded-lg" />
                )}
              </td>
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3 text-stone-500">{product.stores?.name ?? "—"}</td>
              <td className="px-4 py-3 text-stone-500">{product.categories?.name ?? "—"}</td>
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
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deletingId === product.id}
                  className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 transition-colors"
                >
                  {deletingId === product.id ? "Удаление..." : "Удалить"}
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                Товары не найдены
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}