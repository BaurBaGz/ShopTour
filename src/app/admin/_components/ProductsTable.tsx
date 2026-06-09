"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteProductAction, updateProductAction } from "../actions";
// Импортируем функцию создания клиента для фронтенда
import { createClient } from "@/lib/supabase/client"; 

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
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const supabase = createClient();

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

  // Функция для загрузки картинки в Supabase Storage
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !editingProduct) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    // Генерируем уникальное имя файла
    const fileName = `${editingProduct.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    setIsUploading(true);

    try {
      // Загружаем файл в бакет с именем "products" (убедитесь, что у вас создан этот бакет в Supabase)
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Получаем публичную прямую ссылку на файл
      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      // Обновляем состояние редактируемого товара новой картинкой
      setEditingProduct({
        ...editingProduct,
        images: [publicUrl] // Записываем её как основную
      });

    } catch (error: any) {
      alert("Ошибка при загрузке фото: " + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    const { error } = await updateProductAction(editingProduct.id, {
      name: editingProduct.name,
      price: Number(editingProduct.price),
      in_stock: editingProduct.in_stock,
      images: editingProduct.images, // Передаем обновленные картинки
    });

    if (error) {
      alert("Ошибка при сохранении: " + error.message);
    } else {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
      setEditingProduct(null);
    }
    setIsSaving(false);
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
                <ProductImage src={product.images?.[0]} alt={product.name} />
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
              <td className="px-4 py-3 text-right space-x-3">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deletingId === product.id}
                  className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 transition-colors"
                >
                  {deletingId === product.id ? "..." : "Удалить"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* МОДАЛЬНОЕ ОКНО */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b bg-stone-50 flex justify-between items-center">
              <h3 className="font-semibold text-stone-900">Редактирование товара</h3>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-600 text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Секция управления фото */}
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase mb-2">Фото товара</label>
                <div className="flex items-center gap-4">
                  <ProductImage src={editingProduct.images?.[0]} alt={editingProduct.name} />
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id="file-upload"
                      disabled={isUploading}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-4 py-2 text-xs font-medium border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? "Загрузка..." : "Выбрать новое фото"}
                    </label>
                    <p className="text-[11px] text-stone-400 mt-1">PNG, JPG до 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase mb-1">Название товара</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase mb-1">Цена (₸)</label>
                <input
                  type="number"
                  required
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="in_stock"
                  checked={editingProduct.in_stock}
                  onChange={(e) => setEditingProduct({...editingProduct, in_stock: e.target.checked})}
                  className="w-4 h-4 rounded text-stone-900 focus:ring-stone-500"
                />
                <label htmlFor="in_stock" className="text-sm font-medium text-stone-700 select-none">Товар в наличии</label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-sm font-medium border rounded-xl hover:bg-stone-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductImage({ src, alt }: { src: string | undefined; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 text-[10px] font-medium border border-stone-200 shrink-0">
        Нет фото
      </div>
    );
  }

  return (
    <div className="relative w-12 h-12 shrink-0">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover rounded-lg border border-stone-100"
        sizes="48px"
        onError={() => setError(true)}
      />
    </div>
  );
}