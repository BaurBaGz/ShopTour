"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteBannerAction, type BannerState } from "@/app/admin/(panel)/banners/actions";
import { ImagesInput } from "@/components/admin/images-input";
import { BannerSlide, type BannerData } from "@/components/catalog/banner-slide";
import { cn } from "@/lib/utils/cn";
import type { BannerTheme } from "@/types/database";

type BannerEditorProps = {
  action: (prev: BannerState, formData: FormData) => Promise<BannerState>;
  banner?: BannerData & { is_active: boolean };
  canDelete: boolean;
  submitLabel: string;
};

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const label = "mb-1.5 block text-sm font-medium text-stone-700";

const THEMES: { id: BannerTheme; label: string; swatch: string }[] = [
  { id: "rose", label: "Светлый розовый", swatch: "bg-gradient-to-br from-rose-100 to-amber-50" },
  { id: "dark", label: "Тёмный", swatch: "bg-stone-900" },
  { id: "light", label: "Белый", swatch: "bg-white ring-1 ring-stone-300" },
];

/** Редактор баннера с превью, которое меняется по мере ввода */
export function BannerEditor({ action, banner, canDelete, submitLabel }: BannerEditorProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [draft, setDraft] = useState<BannerData>(
    banner ?? { id: "preview", kind: "text", title: "", accent: "", body: "", cta_label: "", cta_href: "", image_url: null, theme: "rose" },
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isSteps = draft.kind === "steps";
  const set = (patch: Partial<BannerData>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
      >
        {isSteps && (
          <p className="rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
            Встроенный баннер «Как это работает»: три шага и ссылки заданы на сайте. Здесь меняются заголовок, подзаголовок и цвет.
          </p>
        )}
        <div>
          <label htmlFor="b-title" className={label}>Заголовок *</label>
          <input id="b-title" name="title" required value={draft.title} onChange={(e) => set({ title: e.target.value })} className={field} />
        </div>
        {!isSteps && (
          <div>
            <label htmlFor="b-accent" className={label}>Выделенная строка</label>
            <input id="b-accent" name="accent" value={draft.accent ?? ""} onChange={(e) => set({ accent: e.target.value })} placeholder="Вторая строка другим цветом" className={field} />
          </div>
        )}
        <div>
          <label htmlFor="b-body" className={label}>{isSteps ? "Подзаголовок" : "Текст"}</label>
          <textarea id="b-body" name="body" rows={isSteps ? 2 : 4} value={draft.body ?? ""} onChange={(e) => set({ body: e.target.value })} className={field} />
        </div>
        {!isSteps && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="b-cta" className={label}>Текст кнопки</label>
              <input id="b-cta" name="cta_label" value={draft.cta_label ?? ""} onChange={(e) => set({ cta_label: e.target.value })} placeholder="Смотреть" className={field} />
            </div>
            <div>
              <label htmlFor="b-href" className={label}>Ссылка кнопки</label>
              <input id="b-href" name="cta_href" value={draft.cta_href ?? ""} onChange={(e) => set({ cta_href: e.target.value })} placeholder="/catalog?category=…" className={field} />
            </div>
            <p className="-mt-2 text-xs text-stone-500 sm:col-span-2">
              «/…» — страница сайта (например, скопируйте адрес каталога с фильтром), «#next» — к следующему баннеру.
            </p>
          </div>
        )}
        <fieldset>
          <legend className={label}>Оформление</legend>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <label key={t.id} className={cn("flex min-h-11 cursor-pointer flex-col items-center gap-1.5 rounded-xl p-2 text-xs ring-1", draft.theme === t.id ? "ring-2 ring-rose-500" : "ring-stone-200 hover:bg-stone-50")}>
                <input type="radio" name="theme" value={t.id} checked={draft.theme === t.id} onChange={() => set({ theme: t.id })} className="sr-only" />
                <span className={cn("h-8 w-full rounded-lg", t.swatch)} aria-hidden />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        {!isSteps && (
          <ImagesInput
            name="image_url"
            label="Фото (необязательно)"
            max={1}
            kind="banners"
            storeId="site"
            defaultValue={banner?.image_url ? [banner.image_url] : []}
            onChange={(urls) => set({ image_url: urls[0] ?? null })}
          />
        )}
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="is_active" defaultChecked={banner?.is_active ?? true} className="h-5 w-5 rounded accent-rose-600" />
          <span className="text-sm text-stone-800">Показывать на сайте</span>
        </label>
        {state.error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
        <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
          {pending ? "Сохраняем…" : submitLabel}
        </button>

        {banner && canDelete && !isSteps && (
          <div className="border-t border-stone-100 pt-4">
            {confirmDelete ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => startDeleting(async () => setDeleteError((await deleteBannerAction(banner.id))?.error ?? null))}
                  className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Удалить баннер
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">Отмена</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 rounded-xl px-3 text-sm font-medium text-red-700 hover:bg-red-50">Удалить…</button>
            )}
            {deleteError && <p role="alert" className="mt-2 text-sm text-red-700">{deleteError}</p>}
          </div>
        )}
      </form>

      <div className="flex min-w-0 flex-col gap-4">
        <p className="text-sm font-medium text-stone-700">Превью — так баннер выглядит над каталогом</p>
        <div className="min-h-56">
          <BannerSlide banner={{ ...draft, title: draft.title || "Заголовок баннера" }} onNext={() => undefined} />
        </div>
        <p className="text-sm font-medium text-stone-700">На телефоне</p>
        <div className="w-[340px] max-w-full min-h-72">
          <BannerSlide banner={{ ...draft, title: draft.title || "Заголовок баннера" }} onNext={() => undefined} />
        </div>
      </div>
    </div>
  );
}
