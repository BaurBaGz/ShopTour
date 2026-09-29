"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addStaffAction,
  changeStaffRoleAction,
  removeStaffAction,
  type AddStaffState,
} from "@/app/admin/(panel)/staff/actions";
import { cn } from "@/lib/utils/cn";
import type { StaffRole } from "@/types/database";

type StaffRow = {
  user_id: string;
  email: string;
  name: string | null;
  role: StaffRole;
  must_change_password: boolean;
  created_at: string;
};

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });

export function StaffManager({ rows, currentUserId }: { rows: StaffRow[]; currentUserId: string }) {
  const [state, addAction, adding] = useActionState<AddStaffState, FormData>(addStaffAction, {});
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ error: string | null | undefined }>) =>
    startTransition(async () => {
      const result = await fn();
      setRowError(result.error ?? null);
      setConfirmRemove(null);
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Сотрудники</h2>
          <span className="text-sm text-stone-500">{rows.length}</span>
        </div>
        {rowError && (
          <p role="alert" className="mx-5 mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {rowError}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="px-5 py-3 font-medium">Сотрудник</th>
                <th className="px-5 py-3 font-medium">Роль</th>
                <th className="px-5 py-3 font-medium">Добавлен</th>
                <th className="px-5 py-3 font-medium">
                  <span className="sr-only">Действия</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((row) => {
                const isMe = row.user_id === currentUserId;
                return (
                  <tr key={row.user_id} className={cn(pending && "opacity-60")}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-stone-900">
                        {row.name || row.email} {isMe && <span className="text-stone-500">(вы)</span>}
                      </p>
                      {row.name && <p className="text-stone-500">{row.email}</p>}
                      {row.must_change_password && (
                        <p className="text-xs text-amber-700">Ещё не сменил временный пароль</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isMe ? (
                        <span className="text-stone-700">{row.role === "admin" ? "Администратор" : "Модератор"}</span>
                      ) : (
                        <select
                          aria-label={`Роль: ${row.email}`}
                          defaultValue={row.role}
                          disabled={pending}
                          onChange={(e) => run(() => changeStaffRoleAction(row.user_id, e.target.value as StaffRole))}
                          className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
                        >
                          <option value="admin">Администратор</option>
                          <option value="moderator">Модератор</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-500">{dateFormat.format(new Date(row.created_at))}</td>
                    <td className="px-5 py-3 text-right">
                      {!isMe &&
                        (confirmRemove === row.user_id ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => run(() => removeStaffAction(row.user_id))}
                              disabled={pending}
                              className="min-h-11 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700"
                            >
                              Отключить
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRemove(null)}
                              className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100"
                            >
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
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Добавить сотрудника</h2>
        <p className="mt-1 text-sm text-stone-500">
          Если у человека ещё нет аккаунта, мы создадим его и покажем временный пароль — передайте его
          сотруднику. При первом входе он задаст свой.
        </p>
        <form action={addAction} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_200px_auto] sm:items-end">
          <div>
            <label htmlFor="staff-email" className="mb-1.5 block text-sm font-medium text-stone-700">
              Email *
            </label>
            <input id="staff-email" name="email" type="email" required className={field} placeholder="name@example.com" />
          </div>
          <div>
            <label htmlFor="staff-name" className="mb-1.5 block text-sm font-medium text-stone-700">
              Имя
            </label>
            <input id="staff-name" name="name" className={field} placeholder="Как подписать в админке" />
          </div>
          <div>
            <label htmlFor="staff-role" className="mb-1.5 block text-sm font-medium text-stone-700">
              Роль *
            </label>
            <select id="staff-role" name="role" defaultValue="moderator" className={field}>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
          >
            {adding ? "Добавляем…" : "Добавить"}
          </button>
        </form>
        <p className="mt-3 text-xs text-stone-500">
          Модератор редактирует партнёров, товары и баннеры, но ничего не удаляет и не видит этот раздел.
        </p>

        {state.error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {state.success}
          </p>
        )}
        {state.created && (
          <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Аккаунт создан. Передайте сотруднику данные для входа:</p>
            <p className="mt-2">
              Адрес: <span className="font-mono">/auth/login</span>
              <br />
              Email: <span className="font-mono">{state.created.email}</span>
              <br />
              Временный пароль: <span className="font-mono text-base font-semibold">{state.created.password}</span>
            </p>
            <p className="mt-2 text-amber-800">Пароль показывается только сейчас — сохраните его.</p>
          </div>
        )}
      </section>
    </div>
  );
}
