"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createReservationAction, type ReserveState } from "@/app/(site)/reservations/actions";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { submitKeepingValues } from "@/lib/form-submit";

// Имя и телефон запоминаем — вторая бронь в два касания
const CONTACT_KEY = "shoptour:contact";
/** Гость нажал «Отложить» — после регистрации напомним вернуться к брони */
export const PENDING_RESERVE_KEY = "shoptour:pending-reserve";

type ReserveSheetProps = {
  product: { id: string; name: string; price: number };
  size: string | null;
  /** Вошедший покупатель; null — вместо формы предлагаем войти */
  viewer: { name: string; phone: string } | null;
  onClose: () => void;
};

const inputClass =
  "min-h-12 w-full rounded-xl border border-stone-200 px-4 text-base outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";

/** «Отложить в магазине»: имя, телефон, когда придёте. Снизу на телефоне, по центру на компьютере. */
export function ReserveSheet({ product, size, viewer, onClose }: ReserveSheetProps) {
  const [state, action, pending] = useActionState<ReserveState, FormData>(createReservationAction, {});
  const t = useT();
  const [visit, setVisit] = useState<"today" | "tomorrow">("today");
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Вернуться к этому товару после входа — с тем же размером и открытой бронью
  const back = `/products/${product.id}?reserve=${encodeURIComponent(size ?? "1")}`;

  useEffect(() => {
    try {
      if (!viewer) {
        window.localStorage.setItem(PENDING_RESERVE_KEY, JSON.stringify({ href: back, name: product.name, size, at: Date.now() }));
      } else {
        window.localStorage.removeItem(PENDING_RESERVE_KEY);
        // Из аккаунта, а если там пусто — из прошлой брони на этом устройстве
        const saved = JSON.parse(window.localStorage.getItem(CONTACT_KEY) ?? "null");
        const name = viewer.name || saved?.name;
        const phone = viewer.phone || saved?.phone;
        if (name && nameRef.current) nameRef.current.value = name;
        if (phone && phoneRef.current) phoneRef.current.value = phone;
      }
    } catch {
      // без подсказки
    }
    (nameRef.current?.value ? phoneRef.current : nameRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, viewer, back, product.name, size]);

  const remember = () => {
    try {
      window.localStorage.setItem(
        CONTACT_KEY,
        JSON.stringify({ name: nameRef.current?.value.trim(), phone: phoneRef.current?.value.trim() }),
      );
    } catch {
      // ничего страшного
    }
  };

  if (!viewer) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <button type="button" aria-label={t.reserve.close} onClick={onClose} className="absolute inset-0 bg-stone-900/40" />
        <div className="relative w-full rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-xl sm:max-w-md sm:rounded-3xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="reserve-title" className="text-lg font-semibold text-stone-900">
                {t.reserve.title}
              </h2>
              <p className="mt-0.5 text-sm text-stone-500">
                {product.name}
                {size ? t.reserve.sizeSuffix(size) : ""} · {formatPrice(product.price)}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label={t.reserve.close} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100">
              ✕
            </button>
          </div>
          <p className="mt-4 text-stone-700">
            {t.reserve.loginText}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href={`/auth/login?next=${encodeURIComponent(back)}`}
              className="flex min-h-12 items-center justify-center rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              {t.nav.login}
            </Link>
            <Link
              href={`/auth/signup?next=${encodeURIComponent(back)}`}
              className="flex min-h-12 items-center justify-center rounded-xl text-sm font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-stone-50"
            >
              {t.reserve.createAccount}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
      <button type="button" aria-label={t.reserve.close} onClick={onClose} className="absolute inset-0 bg-stone-900/40" />
      <form
        onSubmit={submitKeepingValues(action, remember)}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-xl sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <input type="hidden" name="productId" value={product.id} />
        {size && <input type="hidden" name="size" value={size} />}
        <input type="hidden" name="visit" value={visit} />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reserve-title" className="text-lg font-semibold text-stone-900">
              {t.reserve.title}
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              {product.name}
              {size ? t.reserve.sizeSuffix(size) : ""} · {formatPrice(product.price)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.reserve.close} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100">
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="reserve-name" className="mb-1.5 block text-sm font-medium text-stone-700">
              {t.reserve.yourName}
            </label>
            <input id="reserve-name" ref={nameRef} name="name" required maxLength={60} autoComplete="given-name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="reserve-phone" className="mb-1.5 block text-sm font-medium text-stone-700">
              {t.reserve.phone}
            </label>
            <input
              id="reserve-phone"
              ref={phoneRef}
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="+7 701 123 45 67"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-500">{t.reserve.phoneHint}</p>
          </div>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-stone-700">{t.reserve.whenTitle}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["today", t.reserve.today],
                  ["tomorrow", t.reserve.tomorrow],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVisit(value)}
                  aria-pressed={visit === value}
                  className={cn(
                    "min-h-12 rounded-xl text-sm font-medium ring-1 transition",
                    visit === value ? "bg-stone-900 text-white ring-stone-900" : "text-stone-700 ring-stone-200 hover:bg-stone-50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="reserve-comment" className="mb-1.5 block text-sm font-medium text-stone-700">
              {t.reserve.comment} <span className="font-normal text-stone-400">{t.reserve.optional}</span>
            </label>
            <input id="reserve-comment" name="comment" maxLength={300} placeholder={t.reserve.commentPlaceholder} className={inputClass} />
          </div>
        </div>

        {state.error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 min-h-12 w-full rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {pending ? t.reserve.sending : t.reserve.submit}
        </button>
        <p className="mt-3 text-center text-xs text-stone-500">
          {t.reserve.freeNote}
        </p>
      </form>
    </div>
  );
}
