"use client";

import { useState } from "react";
import { getSizeStock } from "@/lib/utils/product";
import type { Json } from "@/types/database";

type Row = { key: number; size: string; stock: string };

type SizeStockEditorProps = {
  sizes?: string[];
  sizeStock?: Json;
};

const inputClass =
  "w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

/** Размеры и остаток по каждому. Отправляется одним полем sizeStock (JSON). */
export function SizeStockEditor({ sizes = [], sizeStock = {} }: SizeStockEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => {
    const initial = sizes.map((size, index) => {
      const stock = getSizeStock({ sizes, size_stock: sizeStock }, size);
      return { key: index, size, stock: stock === undefined ? "" : String(stock) };
    });
    return initial.length > 0 ? initial : [{ key: 0, size: "", stock: "" }];
  });
  const [nextKey, setNextKey] = useState(rows.length);

  const update = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const addRow = () => {
    setRows((current) => [...current, { key: nextKey, size: "", stock: "" }]);
    setNextKey((k) => k + 1);
  };

  const removeRow = (key: number) =>
    setRows((current) => current.filter((row) => row.key !== key));

  const payload = JSON.stringify(
    rows
      .filter((row) => row.size.trim())
      .map((row) => ({ size: row.size.trim(), stock: row.stock.trim() })),
  );

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-stone-700">
        Размеры и остатки
      </legend>
      <p className="mb-3 text-xs text-stone-500">
        Пустой остаток — просто «в наличии», 0 — размер закончился.
      </p>
      <input type="hidden" name="sizeStock" value={payload} />

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2">
            <input
              value={row.size}
              onChange={(e) => update(row.key, { size: e.target.value })}
              placeholder="Размер, напр. M"
              aria-label="Размер"
              className={inputClass}
            />
            <input
              value={row.stock}
              onChange={(e) => update(row.key, { stock: e.target.value })}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="Остаток, шт."
              aria-label={`Остаток размера ${row.size || ""}`.trim()}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              aria-label={`Удалить размер ${row.size || ""}`.trim()}
              className="shrink-0 rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-700"
      >
        + Добавить размер
      </button>
    </fieldset>
  );
}
