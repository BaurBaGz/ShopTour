"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/app/auth/actions";
import { cn } from "@/lib/utils/cn";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
};

type AuthFormProps = {
  title: string;
  subtitle: string;
  fields: Field[];
  submitLabel: string;
  action: (
    prev: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  footer?: React.ReactNode;
};

const initialState: AuthActionState = {};

export function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  action,
  footer,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        <p className="mt-2 text-sm text-stone-500">{subtitle}</p>

        <form action={formAction} className="mt-8 space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-1.5 block text-sm font-medium text-stone-700"
              >
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-stone-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
              />
            </div>
          ))}

          {state.error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {state.success}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={cn(
              "w-full rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600",
              pending && "cursor-not-allowed opacity-60",
            )}
          >
            {pending ? "Подождите…" : submitLabel}
          </button>
        </form>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
