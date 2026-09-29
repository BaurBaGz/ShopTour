"use client";

import { useActionState, useState, useTransition } from "react";
import {
  assignOwnerAction,
  deletePartnerAction,
  removeOwnerAction,
  updatePartnerStatusAction,
  type OwnerState,
} from "@/app/admin/(panel)/partners/actions";
import { STORE_STATUS_HINTS, STORE_STATUS_LABELS } from "@/components/admin/partner-status";
import { cn } from "@/lib/utils/cn";
import type { StoreStatus } from "@/types/database";

const STATUSES: StoreStatus[] = ["published", "draft", "hidden"];

/** Статус партнёра: три кнопки, текущая выделена */
export function PartnerStatusControl({ storeId, status, hasLocation }: { storeId: string; status: StoreStatus; hasLocation: boolean }) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const choose = (next: StoreStatus) =>
    startTransition(async () => {
      const previous = current;
      setCurrent(next);
      const result = await updatePartnerStatusAction(storeId, next);
      if (result.error) {
        setCurrent(previous);
        setError(result.error);
      } else {
        setError(null);
      }
    });

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="status-title">
      <h2 id="status-title" className="text-lg font-semibold text-stone-900">Статус</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Статус партнёра">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={current === s}
            disabled={pending}
            onClick={() => current !== s && choose(s)}
            className={cn(
              "min-h-11 rounded-xl px-4 py-3 text-left text-sm transition",
              current === s ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-800 ring-1 ring-stone-200 hover:bg-stone-100",
            )}
          >
            <span className="block font-semibold">{STORE_STATUS_LABELS[s]}</span>
            <span className={cn("block text-xs", current === s ? "text-stone-300" : "text-stone-500")}>{STORE_STATUS_HINTS[s]}</span>
          </button>
        ))}
      </div>
      {current === "published" && !hasLocation && (
        <p className="mt-3 text-sm text-amber-800">Нет точки на карте — магазин есть в каталоге, но не на карте и не в маршрутах.</p>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}

/** Владелец магазина: привязать по email (создаст аккаунт при необходимости) или отвязать */
export function OwnerPanel({ storeId, ownerEmail }: { storeId: string; ownerEmail: string | null }) {
  const [state, action, pending] = useActionState<OwnerState, FormData>(assignOwnerAction.bind(null, storeId), {});
  const [removing, startRemoving] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="owner-title">
      <h2 id="owner-title" className="text-lg font-semibold text-stone-900">Владелец</h2>
      <p className="mt-1 text-sm text-stone-500">
        Владелец сам ведёт товары в кабинете магазина. {ownerEmail ? "" : "Сейчас магазином управляют только сотрудники."}
      </p>
      {ownerEmail && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3">
          <span className="font-medium text-stone-900">{ownerEmail}</span>
          <button
            type="button"
            disabled={removing}
            onClick={() =>
              startRemoving(async () => {
                const result = await removeOwnerAction(storeId);
                setRemoveError(result.error ?? null);
              })
            }
            className="min-h-11 rounded-xl px-3 text-sm font-medium text-stone-600 hover:bg-stone-200"
          >
            Отвязать
          </button>
        </div>
      )}
      {removeError && <p role="alert" className="mt-2 text-sm text-red-700">{removeError}</p>}
      <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="owner-email" className="sr-only">Email владельца</label>
        <input
          id="owner-email"
          name="email"
          type="email"
          required
          placeholder={ownerEmail ? "Сменить на другой email" : "Email владельца"}
          className="min-h-11 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {pending ? "Привязываем…" : "Привязать"}
        </button>
      </form>
      <p className="mt-2 text-xs text-stone-500">Если аккаунта нет — создадим и покажем временный пароль.</p>
      {state.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>}
      {state.created && (
        <div role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Аккаунт создан. Передайте владельцу:</p>
          <p className="mt-2">
            Вход: <span className="font-mono">/auth/login</span>
            <br />
            Email: <span className="font-mono">{state.created.email}</span>
            <br />
            Временный пароль: <span className="font-mono text-base font-semibold">{state.created.password}</span>
          </p>
          <p className="mt-2 text-amber-800">
            Пароль показывается только сейчас. Сменить его можно в кабинете магазина → «Сменить пароль».
          </p>
        </div>
      )}
    </section>
  );
}

/** Удаление партнёра — только администратор, с подтверждением названием */
export function DeletePartner({ storeId, storeName, productCount }: { storeId: string; storeName: string; productCount: number }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6" aria-labelledby="danger-title">
      <h2 id="danger-title" className="text-lg font-semibold text-red-800">Удаление</h2>
      <p className="mt-1 text-sm text-stone-600">
        Магазин удалится вместе со всеми товарами ({productCount}). Вернуть будет нельзя. Чтобы убрать с сайта на время,
        выберите статус «Скрыт».
      </p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 min-h-11 rounded-xl px-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
        >
          Удалить партнёра…
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <label htmlFor="confirm-name" className="text-sm text-stone-700">
            Введите название, чтобы подтвердить: <span className="font-semibold">{storeName}</span>
          </label>
          <input
            id="confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="min-h-11 rounded-xl border border-stone-200 px-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/15"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={typed.trim() !== storeName.trim() || pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deletePartnerAction(storeId);
                  if (result?.error) setError(result.error);
                })
              }
              className="min-h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              {pending ? "Удаляем…" : "Удалить навсегда"}
            </button>
            <button type="button" onClick={() => { setOpen(false); setTyped(""); }} className="min-h-11 rounded-xl px-4 text-sm text-stone-600 hover:bg-stone-100">
              Отмена
            </button>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
      )}
    </section>
  );
}
