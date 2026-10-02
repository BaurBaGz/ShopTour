"use client";

import { useActionState, useState, useTransition } from "react";
import { addSellerAction, removeSellerAction, type AddSellerState } from "@/app/(cabinet)/dashboard/staff/actions";
import { cn } from "@/lib/utils/cn";

type SellerRow = {
  user_id: string;
  email: string;
  name: string | null;
  must_change_password: boolean;
  created_at: string;
};

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const label = "mb-1.5 block text-sm font-medium text-stone-700";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });

/** Сотрудники магазина: владелец и продавцы; добавить продавца, отключить доступ */
export function SellersManager({ owner, rows }: { owner: { email: string }; rows: SellerRow[] }) {
  const [state, addAction, adding] = useActionState<AddSellerState, FormData>(addSellerAction, {});
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (userId: string) =>
    startTransition(async () => {
      const result = await removeSellerAction(userId);
      setRowError(result.error);
      setConfirmRemove(null);
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Сотрудники</h2>
          <span className="text-sm text-stone-500">{rows.length + 1}</span>
        </div>
        {rowError && (
          <p role="alert" className="mx-5 mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {rowError}
          </p>
        )}
        <ul className="divide-y divide-stone-100">
          <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">
                {owner.email} <span className="font-normal text-stone-500">(вы)</span>
              </p>
              <p className="text-sm text-stone-500">Владелец — полный доступ</p>
            </div>
          </li>
          {rows.map((row) => (
            <li key={row.user_id} className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-3", pending && "opacity-60")}>
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{row.name || row.email}</p>
                <p className="truncate text-sm text-stone-500">
                  Продавец{row.name ? ` · ${row.email}` : ""} · с {dateFormat.format(new Date(row.created_at))}
                </p>
                {row.must_change_password && <p className="text-xs text-amber-700">Ещё не сменил временный пароль</p>}
              </div>
              {confirmRemove === row.user_id ? (
                <span className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => remove(row.user_id)}
                    disabled={pending}
                    className="min-h-11 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Отключить
                  </button>
                  <button type="button" onClick={() => setConfirmRemove(null)} className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">
                    Отмена
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(row.user_id)}
                  className="min-h-11 rounded-xl px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Отключить доступ
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Добавить продавца</h2>
        <p className="mt-1 text-sm text-stone-500">
          Продавец отвечает на брони, добавляет и меняет товары, ставит скидки и акции, видит статистику. Он не может
          удалять товары (только убрать в черновик), менять профиль магазина и добавлять сотрудников.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Если у человека ещё нет аккаунта, мы создадим его и покажем временный пароль — передайте его продавцу. При
          первом входе он задаст свой.
        </p>
        <form action={addAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="seller-email" className={label}>Email *</label>
            <input id="seller-email" name="email" type="email" required autoComplete="off" placeholder="prodavec@example.com" className={field} />
          </div>
          <div>
            <label htmlFor="seller-name" className={label}>Имя</label>
            <input id="seller-name" name="name" maxLength={60} autoComplete="off" placeholder="Как зовут" className={field} />
          </div>
          <button type="submit" disabled={adding} className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
            {adding ? "Добавляем…" : "Добавить"}
          </button>
        </form>

        {state.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</p>}
        {state.created && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Аккаунт создан. Передайте продавцу данные для входа — пароль показывается один раз:</p>
            <p className="mt-2">
              Email: <span className="font-mono font-semibold">{state.created.email}</span>
            </p>
            <p>
              Временный пароль: <span className="font-mono font-semibold">{state.created.password}</span>
            </p>
            <p className="mt-2 text-emerald-800">Вход: shoptour.kz → «Войти». При первом входе сайт попросит задать свой пароль.</p>
          </div>
        )}
      </section>
    </div>
  );
}
