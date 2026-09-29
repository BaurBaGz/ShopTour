"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PartnerStatusBadge } from "@/components/admin/partner-status";
import type { PartnerRow } from "@/lib/data/admin-partners";
import { cn } from "@/lib/utils/cn";
import { getStoreColor, getStoreInitial } from "@/lib/utils/store-color";

export type PartnerFilter = "all" | "published" | "draft" | "hidden" | "no-location" | "no-owner";

const FILTERS: { id: PartnerFilter; label: string; test: (p: PartnerRow) => boolean }[] = [
  { id: "all", label: "Все", test: () => true },
  { id: "published", label: "Опубликованы", test: (p) => p.status === "published" },
  { id: "draft", label: "Черновики", test: (p) => p.status === "draft" },
  { id: "hidden", label: "Скрыты", test: (p) => p.status === "hidden" },
  { id: "no-location", label: "Без точки на карте", test: (p) => p.latitude === null || p.longitude === null },
  { id: "no-owner", label: "Без владельца", test: (p) => !p.owner_id },
];

export function PartnersTable({ rows, initialFilter }: { rows: PartnerRow[]; initialFilter: PartnerFilter }) {
  const [filter, setFilter] = useState<PartnerFilter>(initialFilter);
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, rows.filter(f.test).length])) as Record<PartnerFilter, number>,
    [rows],
  );

  const visible = useMemo(() => {
    const test = FILTERS.find((f) => f.id === filter)!.test;
    const q = query.trim().toLowerCase();
    return rows.filter(
      (p) =>
        test(p) &&
        (!q || [p.name, p.address, p.city, p.ownerEmail ?? ""].some((v) => v.toLowerCase().includes(q))),
    );
  }, [rows, filter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр партнёров">
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
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: название, адрес, email владельца"
          aria-label="Поиск партнёров"
          className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15 lg:w-80"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-5 py-3 font-medium">Партнёр</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Товары</th>
                <th className="px-5 py-3 font-medium">Владелец</th>
                <th className="px-5 py-3 font-medium">Карта</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visible.map((p) => (
                <tr key={p.id} className="transition hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/partners/${p.id}`} className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: getStoreColor(p.id) }}
                        aria-hidden
                      >
                        {p.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          getStoreInitial(p.name)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-stone-900 hover:text-rose-700">{p.name}</span>
                        <span className="block truncate text-stone-500">
                          {p.city}, {p.address}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <PartnerStatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3 tabular-nums text-stone-700">
                    {p.stats.total}
                    <span className="text-stone-500"> · в наличии {p.stats.inStock}</span>
                    {p.stats.withoutPhoto > 0 && (
                      <span className="block text-xs text-amber-700">без фото: {p.stats.withoutPhoto}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {p.ownerEmail ?? <span className="text-amber-700">нет владельца</span>}
                  </td>
                  <td className="px-5 py-3">
                    {p.latitude !== null && p.longitude !== null ? (
                      <span className="text-emerald-700">есть</span>
                    ) : (
                      <span className="text-amber-700">нет точки</span>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-500">
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
