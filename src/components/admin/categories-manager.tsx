"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  renameCategoryAction,
  type CategoryState,
} from "@/app/admin/(panel)/categories/actions";
import { cn } from "@/lib/utils/cn";
import { formatProductCount } from "@/lib/utils/format";

type CategoryRow = { id: string; name: string; productCount: number };

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent";

export function CategoriesManager({ rows, canDelete }: { rows: CategoryRow[]; canDelete: boolean }) {
  const [state, addAction, adding] = useActionState<CategoryState, FormData>(addCategoryAction, {});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error: string | null | undefined }>, after?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      setError(result.error ?? null);
      if (!result.error) after?.();
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Категории</h2>
          <span className="text-sm text-stone-500">Порядок — как в фильтрах сайта</span>
        </div>
        {error && <p role="alert" className="mx-5 mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <ol className={cn("divide-y divide-stone-100", pending && "opacity-70")}>
          {rows.map((row, index) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
              <span className="w-6 text-sm tabular-nums text-stone-500">{index + 1}</span>
              {editing === row.id ? (
                <form
                  className="flex min-w-0 flex-1 flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => renameCategoryAction(row.id, draft), () => setEditing(null));
                  }}
                >
                  <label htmlFor={`cat-${row.id}`} className="sr-only">Название</label>
                  <input id={`cat-${row.id}`} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus className={cn(field, "max-w-sm flex-1")} />
                  <button type="submit" className="min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-rose-600">Сохранить</button>
                  <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">Отмена</button>
                </form>
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{row.name}</p>
                  <p className="text-xs text-stone-500">{formatProductCount(row.productCount)}</p>
                </div>
              )}
              {editing !== row.id && (
                <div className="flex items-center">
                  <button type="button" disabled={index === 0 || pending} onClick={() => run(() => moveCategoryAction(row.id, -1))} aria-label={`Поднять «${row.name}»`} className={iconButton}>↑</button>
                  <button type="button" disabled={index === rows.length - 1 || pending} onClick={() => run(() => moveCategoryAction(row.id, 1))} aria-label={`Опустить «${row.name}»`} className={iconButton}>↓</button>
                  <button
                    type="button"
                    onClick={() => { setEditing(row.id); setDraft(row.name); setConfirmDelete(null); }}
                    className="min-h-11 rounded-xl px-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    Переименовать
                  </button>
                  {canDelete &&
                    (confirmDelete === row.id ? (
                      <>
                        <button type="button" onClick={() => run(() => deleteCategoryAction(row.id), () => setConfirmDelete(null))} className="min-h-11 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700">Удалить</button>
                        <button type="button" onClick={() => setConfirmDelete(null)} className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">Отмена</button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(row.id)}
                        disabled={row.productCount > 0}
                        title={row.productCount > 0 ? "В категории есть товары" : undefined}
                        className="min-h-11 rounded-xl px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:text-stone-300 disabled:hover:bg-transparent"
                      >
                        Удалить
                      </button>
                    ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <form action={addAction} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Новая категория</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="new-category" className="sr-only">Название категории</label>
          <input id="new-category" name="name" required placeholder="Например, Платки и шарфы" className={field} />
          <button type="submit" disabled={adding} className="min-h-11 shrink-0 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
            {adding ? "Добавляем…" : "Добавить"}
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">Новая категория появится в конце списка и в фильтрах сайта.</p>
        {state.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
      </form>
    </div>
  );
}
