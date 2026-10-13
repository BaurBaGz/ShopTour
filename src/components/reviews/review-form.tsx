"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteReviewAction, saveReviewAction, type ReviewState } from "@/app/(site)/reviews/actions";
import type { PublicReview } from "@/lib/data/reviews";
import { useT } from "@/lib/i18n/client";
import { submitKeepingValues } from "@/lib/form-submit";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";
import type { ReviewFit, ReviewOutcome } from "@/types/database";

const OUTCOMES: ReviewOutcome[] = ["bought", "tried", "visited", "online"];
const FITS: ReviewFit[] = ["small", "true", "large"];

const label = "mb-1.5 block text-sm font-medium text-stone-700";
const field =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const chip = (on: boolean) =>
  cn(
    "min-h-11 rounded-xl px-3 text-sm font-medium ring-1 transition sm:min-h-9",
    on ? "bg-stone-900 text-white ring-stone-900" : "text-stone-700 ring-stone-200 hover:bg-stone-50",
  );

/** Выбор оценки: повторное нажатие на ту же звезду снимает оценку */
function StarPicker({ name, title, value, onChange }: { name: string; title: string; value: number | null; onChange: (v: number | null) => void }) {
  const r = useT().reviews;
  return (
    <fieldset>
      <legend className={label}>{title}</legend>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            aria-label={r.stars(n)}
            aria-pressed={value === n}
            className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition hover:bg-amber-50", value && n <= value ? "text-amber-500" : "text-stone-300")}
          >
            ★
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type ReviewFormProps = {
  productId: string;
  mine: PublicReview | null;
  defaultName: string;
  onDone: () => void;
};

/** Форма отзыва: как сходил, две оценки, «как сидит», текст и подпись */
export function ReviewForm({ productId, mine, defaultName, onDone }: ReviewFormProps) {
  const r = useT().reviews;
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(saveReviewAction, {});
  const [outcome, setOutcome] = useState<ReviewOutcome | null>(mine?.outcome ?? null);
  const [fit, setFit] = useState<ReviewFit | null>(mine?.fit ?? null);
  const [productRating, setProductRating] = useState<number | null>(mine?.product_rating ?? null);
  const [storeRating, setStoreRating] = useState<number | null>(mine?.store_rating ?? null);
  const [removing, startRemoving] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.success) return;
    showToast({ message: state.success });
    onDone();
  }, [state, onDone]);

  const remove = () => {
    if (!mine || !window.confirm(r.removeConfirm)) return;
    startRemoving(async () => {
      const result = await deleteReviewAction(mine.id);
      if (result.error) setRemoveError(result.error);
      else onDone();
    });
  };

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <input type="hidden" name="productId" value={productId} />

      <fieldset>
        <legend className={label}>{r.howWasIt}</legend>
        <input type="hidden" name="outcome" value={outcome ?? ""} />
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(outcome === o ? null : o)} className={chip(outcome === o)}>
              {r.outcome[o]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <StarPicker name="productRating" title={r.rateProduct} value={productRating} onChange={setProductRating} />
        <StarPicker name="storeRating" title={r.rateStore} value={storeRating} onChange={setStoreRating} />
      </div>
      <p className="-mt-3 text-xs text-stone-500">{r.ratingHint}</p>

      <fieldset>
        <legend className={label}>{r.howFits}</legend>
        <input type="hidden" name="fit" value={fit ?? ""} />
        <div className="flex flex-wrap gap-2">
          {FITS.map((f) => (
            <button key={f} type="button" aria-pressed={fit === f} onClick={() => setFit(fit === f ? null : f)} className={chip(fit === f)}>
              {r.fit[f]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-body" className={label}>{r.body}</label>
        <textarea id="review-body" name="body" rows={4} maxLength={1000} defaultValue={mine?.body ?? ""} placeholder={r.bodyPlaceholder} className={field} />
      </div>

      <div>
        <label htmlFor="review-name" className={label}>{r.name}</label>
        <input id="review-name" name="authorName" required maxLength={40} defaultValue={mine?.author_name ?? defaultName} placeholder={r.namePlaceholder} className={field} />
        <p className="mt-1 text-xs text-stone-500">{r.publicNote}</p>
      </div>

      {(state.error || removeError) && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error ?? removeError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending || removing} className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
          {pending ? r.saving : mine ? r.save : r.publish}
        </button>
        <button type="button" onClick={onDone} className="min-h-11 rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
          {r.cancel}
        </button>
        {mine && (
          <button type="button" onClick={remove} disabled={removing} className="ml-auto min-h-11 rounded-xl px-4 text-sm font-medium text-red-700 ring-1 ring-stone-200 hover:bg-red-50 disabled:opacity-60">
            {r.remove}
          </button>
        )}
      </div>
    </form>
  );
}
