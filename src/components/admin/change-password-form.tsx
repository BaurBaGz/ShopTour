"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type PasswordState,
} from "@/app/admin/(panel)/account/actions";

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

export function ChangePasswordForm({ forced = false }: { forced?: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, {});

  return (
    <form action={action} className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-stone-900">
        {forced ? "Придумайте свой пароль" : "Сменить пароль"}
      </h2>
      {forced && (
        <p className="mt-1 text-sm text-stone-500">
          Вы вошли по временному паролю. Задайте постоянный, чтобы продолжить.
        </p>
      )}
      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
            Новый пароль
          </label>
          <input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" className={field} />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-stone-700">
            Повторите пароль
          </label>
          <input id="confirm" name="confirm" type="password" minLength={8} required autoComplete="new-password" className={field} />
        </div>
      </div>
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
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-11 w-full rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
      >
        {pending ? "Сохраняем…" : "Сохранить пароль"}
      </button>
    </form>
  );
}
