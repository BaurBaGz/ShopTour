"use client";

import { useActionState, useState, useTransition } from "react";
import { addPromotionAction, deletePromotionAction, type PromotionState } from "@/app/(cabinet)/dashboard/promotions-actions";
import { promotionDeadline } from "@/components/promotions/promotion-list";
import type { Promotion } from "@/lib/data/promotions";
import { useT } from "@/lib/i18n/client";
import { submitKeepingValues } from "@/lib/form-submit";

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const label = "mb-1.5 block text-sm font-medium text-stone-700";

type PromotionsPanelProps = {
  promotions: Promotion[];
  /** Кабинет магазина — можно добавлять; админка — только снимать */
  canAdd?: boolean;
  maxActive?: number;
};

/** Акции магазина: список, добавление и снятие */
export function PromotionsPanel({ promotions, canAdd = false, maxActive = 3 }: PromotionsPanelProps) {
  const [state, formAction, pending] = useActionState<PromotionState, FormData>(addPromotionAction, {});
  const [removing, startRemoving] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const t = useT();

  const remove = (id: string) =>
    startRemoving(async () => {
      const result = await deletePromotionAction(id);
      setRemoveError(result.error ?? null);
    });

  return (
    <section aria-labelledby="promotions-title" className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="promotions-title" className="text-xl font-semibold tracking-tight text-stone-900">
        Акции
      </h2>
      {canAdd && (
        <p className="mt-1 text-sm text-stone-500">
          «2+1», «−20% на всё» — акция видна на вашей витрине и во вкладке «Скидки». Когда срок выйдет, она исчезнет сама.
        </p>
      )}

      {promotions.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {promotions.map((promotion) => (
            <li key={promotion.id} className="flex items-start justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">{promotion.title}</p>
                {promotion.description && <p className="mt-0.5 text-sm text-stone-600">{promotion.description}</p>}
                <p className="mt-0.5 text-xs font-medium text-rose-700">{promotionDeadline(promotion, t)}</p>
              </div>
              <button
                type="button"
                disabled={removing}
                onClick={() => remove(promotion.id)}
                className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-red-700 ring-1 ring-stone-200 hover:bg-red-50 disabled:opacity-60"
              >
                Снять
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-stone-500">Акций пока нет.</p>
      )}
      {removeError && <p role="alert" className="mt-2 text-sm text-red-700">{removeError}</p>}

      {canAdd &&
        (promotions.length >= maxActive ? (
          <p className="mt-4 text-sm text-stone-500">Одновременно можно вести до {maxActive} акций — снимите одну, чтобы добавить новую.</p>
        ) : (
          <form onSubmit={submitKeepingValues(formAction)} className="mt-5 grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="promo-title" className={label}>Что за акция *</label>
              <input id="promo-title" name="title" required minLength={3} maxLength={80} placeholder="Например: 2+1 на все футболки" className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="promo-description" className={label}>Условия</label>
              <textarea id="promo-description" name="description" rows={2} maxLength={300} placeholder="Третья вещь в подарок — самая недорогая из трёх" className={field} />
            </div>
            <div>
              <label htmlFor="promo-ends" className={label}>Действует до</label>
              <input id="promo-ends" name="endsOn" type="date" className={field} />
              <p className="mt-1 text-xs text-stone-500">Пусто — акция без срока</p>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={pending} className="min-h-11 w-full rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60 sm:w-auto">
                {pending ? "Добавляем…" : "Добавить акцию"}
              </button>
            </div>
            {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
            {state.success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:col-span-2">{state.success}</p>}
          </form>
        ))}
    </section>
  );
}
