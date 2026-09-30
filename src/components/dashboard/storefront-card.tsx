"use client";

import { useActionState, useState } from "react";
import { updateSlugAction, type SlugState } from "@/app/(site)/dashboard/actions";
import { showToast } from "@/lib/toast";

/** Ссылка на витрину магазина для шапки Instagram: скопировать, открыть, сменить адрес */
export function StorefrontCard({ slug, published }: { slug: string; published: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<SlugState, FormData>(async (prev, formData) => {
    const result = await updateSlugAction(prev, formData);
    // Сохранили — закрываем форму, новый адрес уже придёт с обновлённой страницей
    if (result.success) setEditing(false);
    return result;
  }, {});
  const host = "shoptour.kz";
  const path = `/s/${slug}`;

  const copy = async () => {
    const url = `https://www.${host}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: "Ссылка скопирована — вставьте её в шапку Instagram" });
    } catch {
      showToast({ message: url });
    }
  };

  return (
    <section aria-labelledby="storefront-title" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="storefront-title" className="text-lg font-semibold text-stone-900">
        Ваша витрина
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Все ваши товары, наличие размеров, адрес на карте и кнопка WhatsApp — на одной странице. Поставьте ссылку в
        шапку Instagram вместо Taplink.
      </p>

      <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-stone-50 p-3 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 truncate font-mono text-sm text-stone-900">
          {host}
          {path}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="min-h-11 flex-1 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 sm:flex-none"
          >
            Скопировать
          </button>
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-white sm:flex-none"
          >
            Открыть
          </a>
        </div>
      </div>

      {!published && (
        <p className="mt-2 text-xs text-amber-800">
          Пока магазин на проверке, витрину видите только вы. Ссылку можно добавить в Instagram заранее.
        </p>
      )}

      {editing ? (
        <form action={action} className="mt-4 flex flex-col gap-2">
          <label htmlFor="slug" className="text-sm font-medium text-stone-700">
            Адрес витрины
          </label>
          <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-white pl-3 focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-500/15">
            <span className="shrink-0 text-sm text-stone-500">{host}/s/</span>
            <input
              id="slug"
              name="slug"
              defaultValue={slug}
              required
              maxLength={40}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-11 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
            />
          </div>
          <p className="text-xs text-stone-500">Латинские буквы, цифры и дефис. Например: fus-store</p>
          {state.error && (
            <p role="alert" className="text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
            >
              {pending ? "Сохраняем…" : "Сохранить"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="min-h-11 px-3 text-sm font-medium text-stone-500 hover:text-stone-900">
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center text-sm font-medium text-rose-600 hover:text-rose-700">
            Изменить адрес
          </button>
          {state.success && (
            <p role="status" className="text-sm text-emerald-700">
              {state.success}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
