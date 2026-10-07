"use client";

import { useT } from "@/lib/i18n/client";
import { useState } from "react";
import { getSizeStock } from "@/lib/utils/product";
import type { Json } from "@/types/database";

type Row = { key: number; size: string; stock: string; custom?: boolean };

// Размеры для выпадающего списка; чего нет в списке — «Другой размер…» и ввод вручную
const SIZE_GROUPS: { id: "letters" | "clothing" | "jeans" | "shoes" | "kids" | "other"; sizes: string[] }[] = [
  { id: "letters", sizes: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"] },
  { id: "clothing", sizes: ["40", "42", "44", "46", "48", "50", "52", "54", "56", "58", "60"] },
  { id: "jeans", sizes: ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38"] },
  { id: "shoes", sizes: ["33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"] },
  { id: "kids", sizes: ["56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116", "122", "128", "134", "140", "146", "152", "158", "164"] },
  { id: "other", sizes: ["One size"] },
];
const KNOWN_SIZES = new Set(SIZE_GROUPS.flatMap((g) => g.sizes));
const OTHER = "__other__";


type SizeStockEditorProps = {
  sizes?: string[];
  sizeStock?: Json;
};

const inputClass =
  "w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

/** Размеры и остаток по каждому. Отправляется одним полем sizeStock (JSON). */
export function SizeStockEditor({ sizes = [], sizeStock = {} }: SizeStockEditorProps) {
  const c = useT().cabinet.productForm;
  const PRESETS: [string, string[]][] = [
    ["XS–XL", ["XS", "S", "M", "L", "XL"]],
    ["42–52", ["42", "44", "46", "48", "50", "52"]],
    [c.presetShoesSmall, ["36", "37", "38", "39", "40", "41"]],
    [c.presetShoesLarge, ["40", "41", "42", "43", "44", "45"]],
    [c.presetOneSize, ["One size"]],
  ];
  const [rows, setRows] = useState<Row[]>(() => {
    const initial = sizes.map((size, index) => {
      const stock = getSizeStock({ sizes, size_stock: sizeStock }, size);
      return { key: index, size, stock: stock === undefined ? "" : String(stock), custom: !KNOWN_SIZES.has(size) };
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

  // Готовые наборы: добавляем недостающие размеры, пустые строки убираем
  const addPreset = (preset: string[]) => {
    setRows((current) => {
      const filled = current.filter((row) => row.size.trim());
      const have = new Set(filled.map((row) => row.size.trim().toUpperCase()));
      let key = nextKey;
      const added = preset.filter((size) => !have.has(size.toUpperCase())).map((size) => ({ key: key++, size, stock: "", custom: !KNOWN_SIZES.has(size) }));
      setNextKey(key);
      return [...filled, ...added];
    });
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
        {c.sizesTitle}
      </legend>
      <p className="mb-3 text-xs text-stone-500">
        {c.sizesHint}
      </p>
      <input type="hidden" name="sizeStock" value={payload} />

      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map(([label, sizes]) => (
          <button
            key={label}
            type="button"
            onClick={() => addPreset(sizes)}
            className="min-h-11 rounded-xl px-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50 sm:min-h-9"
          >
            + {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <select
                value={row.custom ? OTHER : row.size}
                onChange={(e) =>
                  e.target.value === OTHER ? update(row.key, { custom: true, size: "" }) : update(row.key, { custom: false, size: e.target.value })
                }
                aria-label={c.size}
                className={inputClass}
              >
                <option value="">{c.sizeChoose}</option>
                {SIZE_GROUPS.map((group) => (
                  <optgroup key={group.id} label={c.sizeGroups[group.id]}>
                    {group.sizes.map((size) => (
                      <option key={`${group.id}-${size}`} value={size}>
                        {size}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value={OTHER}>{c.sizeOther}</option>
              </select>
              {row.custom && (
                <input
                  value={row.size}
                  onChange={(e) => update(row.key, { size: e.target.value })}
                  placeholder={c.sizeCustomPlaceholder}
                  aria-label={c.size}
                  maxLength={20}
                  autoFocus
                  className={inputClass}
                />
              )}
            </div>
            <input
              value={row.stock}
              onChange={(e) => update(row.key, { stock: e.target.value })}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder={c.stockPlaceholder}
              aria-label={c.stockOf(row.size || "")}
              className={`${inputClass} max-w-[7.5rem]`}
            />
            <button
              type="button"
              onClick={() => removeRow(row.key)}
              aria-label={c.removeSize(row.size || "")}
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
        {c.addSize}
      </button>
    </fieldset>
  );
}
