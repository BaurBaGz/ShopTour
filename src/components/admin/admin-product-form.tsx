"use client";

import { useActionState, useState } from "react";
import type { AdminProductState } from "@/app/admin/(panel)/products/actions";
import { ImagesInput } from "@/components/admin/images-input";
import { AudienceField } from "@/components/dashboard/audience-field";
import { SizeStockEditor } from "@/components/dashboard/size-stock-editor";
import type { Product } from "@/lib/data/types";
import { submitKeepingValues } from "@/lib/form-submit";

type Option = { id: string; name: string };

type AdminProductFormProps = {
  action: (prev: AdminProductState, formData: FormData) => Promise<AdminProductState>;
  product?: Product;
  stores: (Option & { status: string })[];
  categories: Option[];
  defaultStoreId?: string;
  submitLabel: string;
};

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const label = "mb-1.5 block text-sm font-medium text-stone-700";

export function AdminProductForm({ action, product, stores, categories, defaultStoreId, submitLabel }: AdminProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  // Магазин нужен до загрузки фото: файлы кладутся в его папку
  const [storeId, setStoreId] = useState(product?.store_id ?? defaultStoreId ?? "");

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Основное</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ap-store" className={label}>Магазин *</label>
              <select id="ap-store" name="storeId" required value={storeId} onChange={(e) => setStoreId(e.target.value)} className={field}>
                <option value="" disabled>Выберите магазин</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.status !== "published" ? " (не опубликован)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ap-name" className={label}>Название *</label>
              <input id="ap-name" name="name" required defaultValue={product?.name} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ap-description" className={label}>Описание</label>
              <textarea id="ap-description" name="description" rows={4} defaultValue={product?.description ?? ""} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ap-category" className={label}>Категория *</label>
              <select id="ap-category" name="categoryId" required defaultValue={product?.category_id ?? ""} className={field}>
                <option value="" disabled>Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ap-price" className={label}>Цена, ₸ *</label>
              <input id="ap-price" name="price" type="number" min={0} step={100} required defaultValue={product?.price ?? ""} className={field} />
            </div>
            <div>
              <label htmlFor="ap-old" className={label}>Старая цена, ₸</label>
              <input id="ap-old" name="oldPrice" type="number" min={0} step={100} defaultValue={product?.old_price ?? ""} placeholder="Для скидки" className={field} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <AudienceField defaultValue={product?.audience} />

          <SizeStockEditor sizes={product?.sizes} sizeStock={product?.size_stock} />
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <ImagesInput name="images" defaultValue={product?.images} storeId={storeId || null} />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Показ на сайте</h2>
          <label className="mt-4 flex min-h-11 items-center gap-3">
            <input type="checkbox" name="inStock" defaultChecked={product?.in_stock ?? true} className="h-5 w-5 rounded border-stone-300 accent-rose-600" />
            <span className="text-sm text-stone-800">В наличии</span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="isHidden" defaultChecked={product?.is_hidden ?? false} className="h-5 w-5 rounded border-stone-300 accent-rose-600" />
            <span className="text-sm text-stone-800">Скрыть с сайта</span>
          </label>
          <p className="mt-1 text-xs text-stone-500">Скрытый товар не виден покупателям, но остаётся в админке и кабинете магазина.</p>
        </section>

        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</p>}
        <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
          {pending ? "Сохраняем…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
