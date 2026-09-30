"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTelegramLinkAction,
  respondReservationAction,
  setDailySummaryAction,
  unlinkTelegramAction,
} from "@/app/(site)/dashboard/actions";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { ReservationStatus } from "@/types/database";

export type DashboardReservation = {
  id: string;
  product_name: string;
  size: string | null;
  price: number;
  customer_name: string;
  customer_phone: string;
  phone_label: string;
  visit_label: string;
  comment: string | null;
  status: ReservationStatus;
  created_at: string;
};

const STATUS: Record<ReservationStatus, { label: string; className: string }> = {
  new: { label: "Ждёт ответа", className: "bg-amber-100 text-amber-900" },
  confirmed: { label: "Отложили", className: "bg-emerald-100 text-emerald-800" },
  declined: { label: "Нет в наличии", className: "bg-stone-100 text-stone-600" },
  completed: { label: "Забрали", className: "bg-emerald-50 text-emerald-700" },
  no_show: { label: "Не пришли", className: "bg-stone-100 text-stone-600" },
};

const timeFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });

type Props = {
  reservations: DashboardReservation[];
  telegram: { configured: boolean; connectedAs: string | null; dailySummary: boolean };
};

/** Брони покупателей и подключение Telegram-уведомлений */
export function ReservationsPanel({ reservations: initial, telegram }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState(telegram.dailySummary);

  const toggleSummary = (enabled: boolean) => {
    setSummary(enabled);
    startTransition(async () => {
      const result = await setDailySummaryAction(enabled);
      if (result.error) {
        setSummary(!enabled);
        showToast({ message: result.error });
      }
    });
  };
  const [pending, startTransition] = useTransition();

  const respond = (r: DashboardReservation, status: ReservationStatus) => {
    const before = r.status;
    setItems((list) => list.map((x) => (x.id === r.id ? { ...x, status } : x)));
    startTransition(async () => {
      const result = await respondReservationAction(r.id, status);
      if (result.error) {
        setItems((list) => list.map((x) => (x.id === r.id ? { ...x, status: before } : x)));
        showToast({ message: result.error });
      }
    });
  };

  const connect = () => {
    // Окно открываем сразу по нажатию — иначе браузер заблокирует его как всплывающее
    const tab = window.open("", "_blank");
    startTransition(async () => {
      const result = await createTelegramLinkAction();
      if (result.error || !result.url) {
        tab?.close();
        showToast({ message: result.error ?? "Не получилось" });
        return;
      }
      setLinkUrl(result.url);
      if (tab) tab.location.href = result.url;
    });
  };

  const disconnect = () =>
    startTransition(async () => {
      await unlinkTelegramAction();
      router.refresh();
    });

  const waiting = items.filter((r) => r.status === "new").length;

  return (
    <section aria-labelledby="reservations-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reservations-title" className="text-xl font-semibold tracking-tight text-stone-900">
          Брони {waiting > 0 && <span className="ml-1 rounded-full bg-rose-600 px-2 py-0.5 align-middle text-sm text-white">{waiting}</span>}
        </h2>
        <p className="text-sm text-stone-500">Покупатели просят отложить размер и приходят примерить</p>
      </div>

      {telegram.configured && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm">
          {telegram.connectedAs ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sky-900">
                ✈️ Брони приходят в Telegram: <span className="font-medium">{telegram.connectedAs}</span>
              </p>
              <button type="button" onClick={disconnect} disabled={pending} className="min-h-11 text-sm font-medium text-sky-800 hover:text-sky-950">
                Отключить
              </button>
              <label className="flex min-h-11 w-full items-center gap-3 border-t border-sky-200 pt-2 text-sky-900">
                <input
                  type="checkbox"
                  checked={summary}
                  onChange={(e) => toggleSummary(e.target.checked)}
                  className="h-5 w-5 rounded border-sky-300 text-sky-600 focus:ring-sky-500"
                />
                <span>
                  <span className="font-medium">Утренняя сводка</span> — около 9:00: сколько людей смотрели магазин вчера, брони,
                  советы
                </span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sky-900">
                <span className="font-semibold">Получайте брони в Telegram</span> и отвечайте одной кнопкой — «Отложили» или
                «Нет в наличии».
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={connect}
                  disabled={pending}
                  className="min-h-11 rounded-xl bg-sky-600 px-4 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  Подключить Telegram
                </button>
                {linkUrl && (
                  <span className="text-sky-900">
                    Нажмите «Start» в боте, затем{" "}
                    <button type="button" onClick={() => router.refresh()} className="font-medium underline">
                      обновите страницу
                    </button>
                    . Бот не открылся?{" "}
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                      Открыть
                    </a>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-6 text-center text-sm text-stone-500">
          Броней пока нет. Когда покупатель нажмёт «Отложить» на вашем товаре, бронь появится здесь
          {telegram.connectedAs ? " и придёт в Telegram" : ""}.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id} className={cn("rounded-2xl border bg-white p-4", r.status === "new" ? "border-amber-300" : "border-stone-200")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">
                    {r.product_name}
                    {r.size ? `, ${r.size}` : ""}
                  </p>
                  <p className="text-sm text-stone-500">
                    {formatPrice(r.price)} · придёт {r.visit_label} · {timeFormat.format(new Date(r.created_at))}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS[r.status].className)}>{STATUS[r.status].label}</span>
              </div>
              <p className="mt-2 text-sm text-stone-700">
                {r.customer_name} ·{" "}
                <a href={`tel:+${r.customer_phone}`} className="font-medium text-stone-900 underline decoration-dotted underline-offset-4">
                  {r.phone_label}
                </a>{" "}
                ·{" "}
                <a href={`https://wa.me/${r.customer_phone}`} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700">
                  WhatsApp
                </a>
              </p>
              {r.comment && <p className="mt-1 text-sm text-stone-500">«{r.comment}»</p>}

              {(r.status === "new" || r.status === "confirmed") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "new" ? (
                    <>
                      <button type="button" onClick={() => respond(r, "confirmed")} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 sm:flex-none">
                        ✅ Отложили
                      </button>
                      <button type="button" onClick={() => respond(r, "declined")} className="min-h-11 flex-1 rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 sm:flex-none">
                        Нет в наличии
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => respond(r, "completed")} className="min-h-11 flex-1 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white hover:bg-rose-600 sm:flex-none">
                        Забрали
                      </button>
                      <button type="button" onClick={() => respond(r, "no_show")} className="min-h-11 flex-1 rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 sm:flex-none">
                        Не пришли
                      </button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
