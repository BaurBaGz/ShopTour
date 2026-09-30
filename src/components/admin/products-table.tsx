"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  bulkAudienceAction,
  bulkProductsAction,
  updateProductPriceAction,
  type BulkOp,
} from "@/app/admin/(panel)/products/actions";
import type { AdminProductRow } from "@/lib/data/admin-products";
import { AUDIENCE_OPTIONS } from "@/lib/audience";
import { cn } from "@/lib/utils/cn";
import { formatPrice, formatProductCount } from "@/lib/utils/format";
import { getAvailableSizes, getDiscountPercent } from "@/lib/utils/product";

export type ProductFilter = "all" | "in-stock" | "sold-out" | "hidden" | "discounted" | "no-photo";

const isSoldOut = (p: AdminProductRow) => !p.in_stock || (p.sizes.length > 0 && getAvailableSizes(p).length === 0);

const FILTERS: { id: ProductFilter; label: string; test: (p: AdminProductRow) => boolean }[] = [
  { id: "all", label: "Все", test: () => true },
  { id: "in-stock", label: "В наличии", test: (p) => !isSoldOut(p) && !p.is_hidden },
  { id: "sold-out", label: "Нет в наличии", test: isSoldOut },
  { id: "hidden", label: "Скрытые", test: (p) => p.is_hidden },
  { id: "discounted", label: "Со скидкой", test: (p) => getDiscountPercent(p) !== null },
  { id: "no-photo", label: "Без фото", test: (p) => !p.images?.length },
];

type Option = { id: string; name: string };

type ProductsTableProps = {
  rows: AdminProductRow[];
  stores: Option[];
  categories: Option[];
  initialFilter: ProductFilter;
  initialStore?: string;
  canDelete: boolean;
};

const select =
  "min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

export function ProductsTable({ rows, stores, categories, initialFilter, initialStore, canDelete }: ProductsTableProps) {
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [storeId, setStoreId] = useState(initialStore ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [audience, setAudience] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [percent, setPercent] = useState("20");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const base = useMemo(
    () =>
      rows.filter(
        (p) =>
          (!storeId || p.store?.id === storeId) &&
          (!categoryId || p.category?.id === categoryId) &&
          (!audience || p.audience === audience) &&
          (!query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [rows, storeId, categoryId, audience, query],
  );
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, base.filter(f.test).length])) as Record<ProductFilter, number>,
    [base],
  );
  const visible = useMemo(() => base.filter(FILTERS.find((f) => f.id === filter)!.test), [base, filter]);

  const selectedVisible = visible.filter((p) => selected.has(p.id));
  const allChecked = visible.length > 0 && selectedVisible.length === visible.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((current) => {
      const next = new Set(current);
      if (allChecked) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });

  const runBulk = (op: BulkOp) =>
    startTransition(async () => {
      const ids = selectedVisible.map((p) => p.id);
      const result = await bulkProductsAction(ids, op, op === "discount" ? Number(percent) : undefined);
      setConfirmDelete(false);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      const verb = {
        hide: "скрыто",
        show: "показано на сайте",
        discount: `уценено на ${percent}%`,
        "clear-discount": "без скидки",
        delete: "удалено",
      }[op];
      setMessage({ kind: "ok", text: `${formatProductCount(result.count)}: ${verb}` });
      if (op === "delete") setSelected(new Set());
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр товаров">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition",
              filter === f.id ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {f.label}
            <span className={cn("text-xs", filter === f.id ? "text-stone-300" : "text-stone-500")}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_220px_200px]">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию"
          aria-label="Поиск товаров"
          className={select}
        />
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} aria-label="Магазин" className={select}>
          <option value="">Все магазины</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Категория" className={select}>
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={audience} onChange={(e) => setAudience(e.target.value)} aria-label="Для кого" className={select}>
          <option value="">Для всех</option>
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"}>
          {message.text}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className={cn("w-full min-w-[820px] text-sm", pending && "opacity-60")}>
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Отметить все на экране" className="h-5 w-5 rounded border-stone-300 accent-rose-600" />
                </th>
                <th className="px-3 py-3 font-medium">Товар</th>
                <th className="px-3 py-3 font-medium">Категория</th>
                <th className="px-3 py-3 font-medium">Цена, ₸</th>
                <th className="px-3 py-3 font-medium">Наличие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((p) => (
                <ProductRow key={p.id} product={p} checked={selected.has(p.id)} onToggle={() => toggle(p.id)} />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVisible.length > 0 && (
        <div
          className="sticky bottom-0 z-30 -mx-4 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          role="region"
          aria-label="Действия с отмеченными товарами"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold text-stone-900">Отмечено: {selectedVisible.length}</span>
            <select
              aria-label="Для кого — для отмеченных"
              value=""
              disabled={pending}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) return;
                startTransition(async () => {
                  const result = await bulkAudienceAction(selectedVisible.map((p) => p.id), value);
                  const label = AUDIENCE_OPTIONS.find((o) => o.id === value)?.label ?? value;
                  setMessage(result.error ? { kind: "error", text: result.error } : { kind: "ok", text: `${formatProductCount(result.count)}: «${label}»` });
                });
              }}
              className="min-h-11 rounded-xl bg-white px-3 text-sm font-medium ring-1 ring-stone-200"
            >
              <option value="">Для кого…</option>
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <button type="button" disabled={pending} onClick={() => runBulk("hide")} className="min-h-11 rounded-xl px-4 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50">Скрыть</button>
            <button type="button" disabled={pending} onClick={() => runBulk("show")} className="min-h-11 rounded-xl px-4 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50">Показать</button>
            <span className="inline-flex items-center gap-1 rounded-xl ring-1 ring-stone-200">
              <label htmlFor="bulk-percent" className="sr-only">Процент скидки</label>
              <input id="bulk-percent" type="number" min={1} max={90} value={percent} onChange={(e) => setPercent(e.target.value)} className="min-h-11 w-16 rounded-l-xl px-2 text-right text-sm outline-none" />
              <span className="text-sm text-stone-500">%</span>
              <button type="button" disabled={pending} onClick={() => runBulk("discount")} className="min-h-11 rounded-r-xl px-3 text-sm font-medium text-rose-700 hover:bg-rose-50">Скидка</button>
            </span>
            <button type="button" disabled={pending} onClick={() => runBulk("clear-discount")} className="min-h-11 rounded-xl px-4 text-sm font-medium ring-1 ring-stone-200 hover:bg-stone-50">Убрать скидку</button>
            {canDelete &&
              (confirmDelete ? (
                <span className="inline-flex items-center gap-2">
                  <button type="button" disabled={pending} onClick={() => runBulk("delete")} className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700">
                    Удалить {selectedVisible.length} навсегда
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">Отмена</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 rounded-xl px-4 text-sm font-medium text-red-700 hover:bg-red-50">Удалить…</button>
              ))}
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto min-h-11 rounded-xl px-3 text-sm text-stone-500 hover:bg-stone-100">Снять отметку</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product: p, checked, onToggle }: { product: AdminProductRow; checked: boolean; onToggle: () => void }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(p.price));
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const discount = getDiscountPercent(p);
  const soldOut = isSoldOut(p);
  const available = getAvailableSizes(p);

  const save = () => {
    const value = Number(price);
    if (value === p.price) {
      setEditing(false);
      return;
    }
    startSaving(async () => {
      const result = await updateProductPriceAction(p.id, value);
      if (result.error) setError(result.error);
      else {
        setError(null);
        setEditing(false);
      }
    });
  };

  return (
    <tr className={cn("transition hover:bg-stone-50", checked && "bg-rose-50/40", p.is_hidden && "text-stone-500")}>
      <td className="px-4 py-2">
        <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Отметить «${p.name}»`} className="h-5 w-5 rounded border-stone-300 accent-rose-600" />
      </td>
      <td className="px-3 py-2">
        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
          <span className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {p.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-[10px] text-amber-700">нет фото</span>
            )}
          </span>
          <span className="min-w-0">
            <span className="block font-medium text-stone-900 hover:text-rose-700">{p.name}</span>
            <span className="block text-xs text-stone-500">
              {p.store?.name ?? "—"}
              {p.store && p.store.status !== "published" && " · магазин не опубликован"}
              {p.is_hidden && " · скрыт"}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-2 text-stone-600">
        {p.category?.name ?? "—"}
        <span className="block text-xs text-stone-400">{AUDIENCE_OPTIONS.find((o) => o.id === p.audience)?.label}</span>
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="flex items-center gap-1"
          >
            <label htmlFor={`price-${p.id}`} className="sr-only">Цена «{p.name}»</label>
            <input
              id={`price-${p.id}`}
              type="number"
              min={0}
              step={100}
              value={price}
              autoFocus
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (setPrice(String(p.price)), setEditing(false))}
              className="min-h-11 w-28 rounded-lg border border-rose-300 px-2 text-sm tabular-nums outline-none ring-4 ring-rose-500/15"
            />
            <button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-stone-900 px-3 text-xs font-semibold text-white">
              {saving ? "…" : "OK"}
            </button>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} title="Изменить цену" className="min-h-11 rounded-lg px-2 text-left tabular-nums hover:bg-stone-100">
            {formatPrice(p.price)}
            {discount && (
              <span className="block text-xs text-stone-500">
                <s>{formatPrice(p.old_price!)}</s> <span className="font-semibold text-rose-700">−{discount}%</span>
              </span>
            )}
          </button>
        )}
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      </td>
      <td className="px-3 py-2">
        {soldOut ? (
          <span className="text-amber-700">нет в наличии</span>
        ) : (
          <span className="text-stone-600">{p.sizes.length ? available.join(", ") : "в наличии"}</span>
        )}
      </td>
    </tr>
  );
}
