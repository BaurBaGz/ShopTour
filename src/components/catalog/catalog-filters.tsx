"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Category } from "@/lib/data/types";
import type { CatalogFilterOptions } from "@/lib/data/catalog";
import { cn } from "@/lib/utils/cn";

export type CatalogFilterValues = {
  q?: string;
  category?: string;
  store?: string;
  size?: string;
  min?: string;
  max?: string;
  sort?: string;
};

type CatalogFiltersProps = {
  values: CatalogFilterValues;
  categories: Category[];
  options: CatalogFilterOptions;
};

const fieldClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

const labelClass = "mb-1.5 block text-xs font-medium text-stone-500";

export function CatalogFilters({ values, categories, options }: CatalogFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Сколько фильтров из панели выбрано (поиск и сортировка — отдельно)
  const panelCount = [
    values.category,
    values.store,
    values.size,
    values.min || values.max,
  ].filter(Boolean).length;

  const [panelOpen, setPanelOpen] = useState(panelCount > 0);

  // Пустые поля не отправляем, чтобы адрес оставался коротким
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    for (const element of Array.from(event.currentTarget.elements)) {
      if (
        (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) &&
        element.name &&
        !element.value
      ) {
        element.disabled = true;
      }
    }
  };

  const submitOnChange = () => formRef.current?.requestSubmit();

  return (
    <form
      ref={formRef}
      action="/catalog"
      method="get"
      onSubmit={handleSubmit}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="catalog-search">
          Поиск по каталогу
        </label>
        <input
          id="catalog-search"
          name="q"
          type="search"
          defaultValue={values.q}
          placeholder="Поиск: платье, куртка, кроссовки…"
          className={cn(fieldClass, "sm:flex-1")}
        />

        <div className="flex gap-3">
          <label className="sr-only" htmlFor="catalog-sort">
            Сортировка
          </label>
          <select
            id="catalog-sort"
            name="sort"
            defaultValue={values.sort ?? ""}
            onChange={submitOnChange}
            className={cn(fieldClass, "flex-1 sm:w-48 sm:flex-none")}
          >
            <option value="">Сначала новые</option>
            <option value="price_asc">Сначала дешевле</option>
            <option value="price_desc">Сначала дороже</option>
          </select>

          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="catalog-filter-panel"
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              panelOpen || panelCount > 0
                ? "bg-stone-900 text-white hover:bg-stone-800"
                : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4h18M6 12h12M10 20h4"
              />
            </svg>
            Фильтры
            {panelCount > 0 && (
              <span className="rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">
                {panelCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        id="catalog-filter-panel"
        hidden={!panelOpen}
        className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass} htmlFor="filter-category">
              Категория
            </label>
            <select
              id="filter-category"
              name="category"
              defaultValue={values.category ?? ""}
              onChange={submitOnChange}
              className={fieldClass}
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="filter-store">
              Магазин
            </label>
            <select
              id="filter-store"
              name="store"
              defaultValue={values.store ?? ""}
              onChange={submitOnChange}
              className={fieldClass}
            >
              <option value="">Все магазины</option>
              {options.stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="filter-size">
              Размер
            </label>
            <select
              id="filter-size"
              name="size"
              defaultValue={values.size ?? ""}
              onChange={submitOnChange}
              className={fieldClass}
            >
              <option value="">Любой размер</option>
              {options.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelClass}>Цена, ₸</span>
            <div className="flex items-center gap-2">
              <input
                name="min"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                defaultValue={values.min}
                placeholder="от"
                aria-label="Цена от"
                className={fieldClass}
              />
              <span className="text-stone-400">—</span>
              <input
                name="max"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                defaultValue={values.max}
                placeholder="до"
                aria-label="Цена до"
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Показать товары
          </button>
          <Link
            href="/catalog"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            Сбросить все
          </Link>
        </div>
      </div>
    </form>
  );
}
