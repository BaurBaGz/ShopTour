"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, type DeleteAccountState } from "@/app/(site)/account/actions";
import { submitKeepingValues } from "@/lib/form-submit";
import { useT } from "@/lib/i18n/client";

/** Удаление аккаунта с подтверждением словом */
export function DeleteAccount() {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccountAction, {});
  const [word, setWord] = useState("");
  const t = useT();
  const ready = word.trim().toUpperCase() === t.account.deleteWord;

  return (
    <details className="group rounded-2xl border border-red-200 bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-medium text-red-700">
        {t.account.deleteTitle}
        <span className="text-red-300 transition group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <form onSubmit={submitKeepingValues(action)} className="flex flex-col gap-3 px-5 pb-5 text-sm">
        <p className="text-stone-600">
          {t.account.deleteText}
        </p>
        <label htmlFor="delete-confirm" className="font-medium text-stone-700">
          {t.account.deleteConfirmLabel} <span className="font-semibold text-red-700">{t.account.deleteWord}</span>
        </label>
        <input
          id="delete-confirm"
          name="confirm"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          autoComplete="off"
          className="min-h-11 w-full rounded-xl border border-stone-200 px-3 outline-none focus:border-red-300 focus:ring-4 focus:ring-red-500/15 sm:max-w-xs"
        />
        {state.error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={!ready || pending}
          className="min-h-11 self-start rounded-xl bg-red-600 px-5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? t.account.deleting : t.account.deleteForever}
        </button>
      </form>
    </details>
  );
}
