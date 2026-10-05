"use client";

import { useT } from "@/lib/i18n/client";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  saveProductAction,
  type ProductActionState,
} from "@/app/(cabinet)/dashboard/actions";
import { ImagesInput } from "@/components/admin/images-input";
import { AudienceField } from "@/components/dashboard/audience-field";
import { SizeStockEditor } from "@/components/dashboard/size-stock-editor";
import type { Category, Product } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";
import { submitKeepingValues } from "@/lib/form-submit";

type ProductFormProps = {
  categories: Category[];
  product?: Product;
  /** Магазин владельца — в его папку загружаются фото */
  storeId: string;
};

const initialState: ProductActionState = {};

// Новые товары обычно заводят пачкой одной категории — запоминаем последнюю
const LAST_CATEGORY_KEY = "shoptour:last-category";

const inputClass =
  "min-h-12 w-full rounded-xl border border-stone-200 px-4 py-3 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

/** Товар магазина: сначала фото, название, цена, размеры; скидка и описание — по желанию */
export function ProductForm({ categories, product, storeId }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialState);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const t = useT();
  const c = t.cabinet.productForm;

  useEffect(() => {
    if (product) return;
    try {
      const last = window.localStorage.getItem(LAST_CATEGORY_KEY);
      if (last && categoryRef.current && categories.some((c) => c.id === last)) categoryRef.current.value = last;
    } catch {
      // без хранилища — просто без подсказки
    }
  }, [product, categories]);

  const rememberCategory = () => {
    try {
      if (categoryRef.current?.value) window.localStorage.setItem(LAST_CATEGORY_KEY, categoryRef.current.value);
    } catch {
      // ничего страшного
    }
  };

  const hasExtras = Boolean(product?.old_price || product?.description || product?.in_stock === false || product?.is_draft);

  return (
    <form onSubmit={submitKeepingValues(formAction, rememberCategory)} className="space-y-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
      {product && <input type="hidden" name="productId" value={product.id} />}

      <ImagesInput name="images" defaultValue={product?.images} storeId={storeId} />

      <div>
        <label htmlFor="product-name" className={labelClass}>
          {c.name}
        </label>
        <input id="product-name" name="name" defaultValue={product?.name} required placeholder={c.namePlaceholder} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div>
          <label htmlFor="product-price" className={labelClass}>
            {c.price}
          </label>
          <input
            id="product-price"
            name="price"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            defaultValue={product?.price ?? ""}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="product-category" className={labelClass}>
            {c.category}
          </label>
          <select
            id="product-category"
            ref={categoryRef}
            name="categoryId"
            defaultValue={product?.category_id ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {c.choose}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AudienceField defaultValue={product?.audience} />

      <SizeStockEditor sizes={product?.sizes} sizeStock={product?.size_stock} />

      <details open={hasExtras} className="group rounded-2xl border border-stone-200">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium text-stone-700">
          {c.extras}
          <span className="text-stone-400 transition group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="space-y-5 px-4 pb-4">
          <div>
            <label htmlFor="product-old-price" className={labelClass}>
              {c.oldPrice}
            </label>
            <input
              id="product-old-price"
              name="oldPrice"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              defaultValue={product?.old_price ?? ""}
              placeholder={c.oldPricePlaceholder}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-500">{c.oldPriceHint}</p>
          </div>
          <div>
            <label htmlFor="product-discount-until" className={labelClass}>
              {c.discountUntil}
            </label>
            <input
              id="product-discount-until"
              name="discountUntil"
              type="date"
              defaultValue={product?.discount_until ?? ""}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-500">
              {c.discountUntilHint}
            </p>
          </div>
          <div>
            <label htmlFor="product-description" className={labelClass}>
              {c.description}
            </label>
            <textarea
              id="product-description"
              name="description"
              rows={3}
              defaultValue={product?.description ?? ""}
              placeholder={c.descriptionPlaceholder}
              className={inputClass}
            />
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="inStock"
              defaultChecked={product?.in_stock ?? true}
              className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm text-stone-700">{c.inStock}</span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              name="isDraft"
              defaultChecked={product?.is_draft ?? false}
              className="h-5 w-5 rounded border-stone-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm text-stone-700">
              {c.draft} <span className="text-stone-500">{c.draftHint}</span>
            </span>
          </label>
        </div>
      </details>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* На телефоне кнопки прилипают к низу экрана */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap gap-2 rounded-b-3xl border-t border-stone-100 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur sm:static sm:mx-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "min-h-12 flex-1 rounded-xl bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-rose-600 sm:flex-none",
            pending && "opacity-60",
          )}
        >
          {pending ? c.saving : c.save}
        </button>
        {!product && (
          <button
            type="submit"
            name="then"
            value="new"
            disabled={pending}
            className="min-h-12 flex-1 rounded-xl px-4 text-sm font-semibold text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50 disabled:opacity-60 sm:flex-none"
          >
            {c.saveAndAdd}
          </button>
        )}
        <Link
          href="/dashboard/products"
          className="hidden min-h-12 items-center rounded-xl px-5 text-sm font-medium text-stone-600 hover:bg-stone-50 sm:inline-flex"
        >
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
