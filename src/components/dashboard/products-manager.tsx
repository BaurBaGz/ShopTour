"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { setInStockAction, setSizeStockAction } from "@/app/(cabinet)/dashboard/actions";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { showToast } from "@/lib/toast";
import type { Json } from "@/types/database";

export type ManagedProduct = {
  id: string;
  name: string;
  price: number;
  images: string[];
  sizes: string[];
  size_stock: Json;
  in_stock: boolean;
  is_hidden: boolean;
  is_draft: boolean;
  category: string | null;
};

type Filter = "all" | "available" | "sold";

function stockMap(value: Json): Record<string, number> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, number>) : {};
}

/** Можно ли купить: товар в наличии и хотя бы один размер не закончился */
function isAvailable(p: ManagedProduct) {
  if (!p.in_stock) return false;
  if (p.sizes.length === 0) return true;
  const stock = stockMap(p.size_stock);
  return p.sizes.some((s) => stock[s] === undefined || stock[s] > 0);
}

/** Товары магазина с быстрым учётом: «продали один», «размер закончился», «нет в наличии» */
export function ProductsManager({ products: initial }: { products: ManagedProduct[] }) {
  const [products, setProducts] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: products.length,
      available: products.filter(isAvailable).length,
      sold: products.filter((p) => !isAvailable(p)).length,
    }),
    [products],
  );

  const visible = products.filter((p) => {
    if (filter === "available" && !isAvailable(p)) return false;
    if (filter === "sold" && isAvailable(p)) return false;
    return !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  // Меняем сразу на экране; если сервер не принял — возвращаем как было
  const update = (id: string, patch: Partial<ManagedProduct>, save: () => Promise<{ error?: string }>) => {
    const before = products.find((p) => p.id === id);
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    startTransition(async () => {
      const result = await save();
      if (result.error && before) {
        setProducts((list) => list.map((p) => (p.id === id ? before : p)));
        showToast({ message: `Не сохранилось: ${result.error}` });
      }
    });
  };

  const setSize = (p: ManagedProduct, size: string, value: number | null) => {
    const next = { ...stockMap(p.size_stock) };
    if (value === null) delete next[size];
    else next[size] = value;
    update(p.id, { size_stock: next }, () => setSizeStockAction(p.id, size, value));
  };

  const setInStock = (p: ManagedProduct, inStock: boolean) =>
    update(p.id, { in_stock: inStock }, () => setInStockAction(p.id, inStock));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label htmlFor="product-search" className="sr-only">
          Поиск товара
        </label>
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти товар…"
          className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15 sm:max-w-xs"
        />
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Показать">
          {(
            [
              ["all", "Все"],
              ["available", "В продаже"],
              ["sold", "Закончились"],
            ] as [Filter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={cn(
                "min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium transition sm:min-h-9",
                filter === id ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
              )}
            >
              {label} <span className="opacity-60">{counts[id]}</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p className="py-6 text-center text-sm text-stone-500">Ничего не найдено.</p>}

      <ul className="flex flex-col gap-3">
        {visible.map((p) => {
          const stock = stockMap(p.size_stock);
          const available = isAvailable(p);
          return (
            <li key={p.id} className={cn("rounded-2xl border bg-white p-3 sm:p-4", available ? "border-stone-200" : "border-stone-200 bg-stone-50")}>
              <div className="flex gap-3">
                <Link href={`/dashboard/products/${p.id}/edit`} className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt="" fill sizes="64px" className={cn("object-cover", !available && "opacity-50")} />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-stone-400">нет фото</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/dashboard/products/${p.id}/edit`} className="min-w-0">
                      <p className="line-clamp-2 font-medium text-stone-900">{p.name}</p>
                      <p className="text-sm text-stone-500">
                        {formatPrice(p.price)}
                        {p.category ? ` · ${p.category}` : ""}
                      </p>
                    </Link>
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      className="inline-flex min-h-11 shrink-0 items-center px-1 text-sm font-medium text-rose-600 hover:text-rose-700 sm:min-h-0"
                    >
                      Изменить
                    </Link>
                  </div>
                  {p.is_hidden && <p className="mt-1 text-xs text-amber-700">Скрыт администрацией ShopTour</p>}
                  {p.is_draft && <p className="mt-1 text-xs font-medium text-stone-500">Черновик — покупатели не видят</p>}
                  {!p.images[0] && <p className="mt-1 text-xs text-amber-700">Добавьте фото — без него товар почти не смотрят</p>}
                </div>
              </div>

              {/* Быстрый учёт: у каждого размера «−» (продали) и «+» (привезли) */}
              {p.in_stock && p.sizes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.sizes.map((size) => {
                    const left = stock[size];
                    const out = left === 0;
                    return left === undefined ? (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSize(p, size, 0)}
                        title="Нажмите, если размер закончился"
                        className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm ring-1 ring-emerald-200 bg-emerald-50 text-emerald-800 transition hover:bg-emerald-100"
                      >
                        <span className="font-semibold">{size}</span> есть
                      </button>
                    ) : (
                      <div
                        key={size}
                        className={cn(
                          "flex min-h-11 items-center rounded-xl ring-1",
                          out ? "bg-stone-100 text-stone-400 ring-stone-200" : "bg-white text-stone-900 ring-stone-200",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSize(p, size, Math.max(0, left - 1))}
                          disabled={out}
                          aria-label={`Размер ${size}: продали один`}
                          className="flex h-11 w-10 items-center justify-center rounded-l-xl text-lg font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="min-w-12 text-center text-sm">
                          <span className="font-semibold">{size}</span> {out ? "нет" : `${left} шт`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSize(p, size, left + 1)}
                          aria-label={`Размер ${size}: привезли ещё`}
                          className="flex h-11 w-10 items-center justify-center rounded-r-xl text-lg font-semibold text-stone-600 transition hover:bg-stone-100"
                        >
                          +
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
                <span className={cn("text-sm font-medium", available ? "text-emerald-700" : "text-stone-500")}>
                  {available ? "В продаже" : p.in_stock ? "Все размеры закончились" : "Нет в наличии"}
                </span>
                <button
                  type="button"
                  onClick={() => setInStock(p, !p.in_stock)}
                  className={cn(
                    "min-h-11 rounded-xl px-3 text-sm font-medium ring-1 transition sm:min-h-9",
                    p.in_stock ? "text-stone-600 ring-stone-200 hover:bg-stone-50" : "bg-stone-900 text-white ring-stone-900 hover:bg-rose-600",
                  )}
                >
                  {p.in_stock ? "Снять с продажи" : "Вернуть в продажу"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
