"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteReviewAdminAction, dismissReportAction, setReviewStatusAction } from "@/app/admin/(panel)/reviews/actions";
import type { AdminReview } from "@/lib/data/reviews";

const OUTCOME: Record<string, string> = {
  bought: "купил(а)",
  tried: "примерил(а), не купил(а)",
  visited: "был(а) в магазине",
  online: "смотрел(а) на сайте",
};
const FIT: Record<string, string> = { small: "маломерит", true: "в размер", large: "большемерит" };

const button = "min-h-10 rounded-xl px-3 text-sm font-medium ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:opacity-60";

function stars(n: number | null) {
  return n ? "★".repeat(n) + "☆".repeat(5 - n) : "—";
}

function date(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });
}

function Row({ review, canDelete }: { review: AdminReview; canDelete: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      setError(result.error ?? null);
    });

  return (
    <li className={`rounded-2xl border bg-white p-4 ${review.reported_at ? "border-amber-300" : "border-stone-200"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-stone-900">{review.author_name}</span>
        {review.verified && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">бронировал(а)</span>}
        {review.status === "hidden" && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700">скрыт</span>}
        <span className="text-xs text-stone-500">{date(review.created_at)}</span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {review.stores ? (
          <Link href={`/admin/partners/${review.stores.id}`} className="font-medium hover:text-rose-600">
            {review.stores.name}
          </Link>
        ) : (
          "—"
        )}
        {review.product_name && (
          <>
            {" · "}
            {review.product_id ? (
              <Link href={`/products/${review.product_id}#reviews`} className="hover:text-rose-600" target="_blank">
                {review.product_name}
              </Link>
            ) : (
              review.product_name
            )}
          </>
        )}
      </p>
      <p className="mt-1 text-sm text-stone-700">
        Товар: <span className="text-amber-500">{stars(review.product_rating)}</span> · Магазин: <span className="text-amber-500">{stars(review.store_rating)}</span>
        {review.outcome && ` · ${OUTCOME[review.outcome]}`}
        {review.fit && ` · ${FIT[review.fit]}`}
      </p>
      {review.body && <p className="mt-2 whitespace-pre-line text-sm text-stone-800">{review.body}</p>}
      {review.store_reply && (
        <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-700">
          <span className="text-xs font-semibold text-stone-500">Ответ магазина: </span>
          {review.store_reply}
        </p>
      )}
      {review.reported_at && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span className="font-semibold">Жалоба магазина ({date(review.reported_at)}):</span> {review.report_reason}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {review.status === "published" ? (
          <button type="button" disabled={pending} onClick={() => run(() => setReviewStatusAction(review.id, "hidden"))} className={`${button} text-stone-800`}>
            Скрыть
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => run(() => setReviewStatusAction(review.id, "published"))} className={`${button} text-stone-800`}>
            Вернуть на сайт
          </button>
        )}
        {review.reported_at && (
          <button type="button" disabled={pending} onClick={() => run(() => dismissReportAction(review.id))} className={`${button} text-stone-600`}>
            Жалоба не подтвердилась
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={() => window.confirm("Удалить отзыв насовсем?") && run(() => deleteReviewAdminAction(review.id))}
            className={`${button} text-red-700 hover:bg-red-50`}
          >
            Удалить
          </button>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}

/** Отзывы в админке: скрыть, вернуть, снять жалобу, удалить */
export function AdminReviewsList({ reviews, canDelete }: { reviews: AdminReview[]; canDelete: boolean }) {
  if (reviews.length === 0) return <p className="mt-6 text-sm text-stone-500">Здесь пусто.</p>;
  return (
    <ul className="mt-5 flex flex-col gap-3">
      {reviews.map((review) => (
        <Row key={review.id} review={review} canDelete={canDelete} />
      ))}
    </ul>
  );
}
