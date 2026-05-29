"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveProductAction,
  type ProductActionState,
} from "@/app/dashboard/actions";
import type { Category, Product } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

type ProductFormProps = {
  categories: Category[];
  product?: Product;
};

const initialState: ProductActionState = {};

export function ProductForm({ categories, product }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {product && (
        <input type="hidden" name="productId" value={product.id} />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Название *
        </label>
        <input
          name="name"
          defaultValue={product?.name}
          required
          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Описание
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Цена (₸) *
          </label>
          <input
            name="price"
            type="number"
            min={0}
            step={100}
            defaultValue={product?.price ?? ""}
            required
            className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-stone-700">
            Категория *
          </label>
          <select
            name="categoryId"
            defaultValue={product?.category_id ?? ""}
            required
            className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
          >
            <option value="" disabled>
              Выберите категорию
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          Размеры (через запятую)
        </label>
        <input
          name="sizes"
          defaultValue={product?.sizes?.join(", ") ?? ""}
          placeholder="S, M, L, XL"
          className="w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">
          URL фото (через запятую или с новой строки)
        </label>
        <textarea
          name="images"
          rows={3}
          defaultValue={product?.images?.join("\n") ?? ""}
          placeholder="https://images.unsplash.com/..."
          className="w-full rounded-xl border border-stone-200 px-4 py-3 font-mono text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="inStock"
          defaultChecked={product?.in_stock ?? true}
          className="h-4 w-4 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
        />
        <span className="text-sm text-stone-700">В наличии</span>
      </label>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600",
            pending && "opacity-60",
          )}
        >
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-stone-200 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
