"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribeToasts, type Toast } from "@/lib/toast";

const DURATION_MS = 3500;

/** Одно уведомление за раз: новое заменяет старое */
export function Toaster() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => subscribeToasts(setToast), []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    // Живая область: экранные читалки произнесут текст уведомления
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4"
      style={{ bottom: "calc(var(--toast-bottom, 1.5rem) + env(safe-area-inset-bottom, 0px))" }}
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex max-w-sm items-center gap-4 rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{toast.message}</span>
          {toast.action &&
            (toast.action.href ? (
              <Link
                href={toast.action.href}
                onClick={() => setToast(null)}
                className="inline-flex min-h-11 shrink-0 items-center font-semibold text-rose-300 hover:text-rose-200"
              >
                {toast.action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick?.();
                  setToast(null);
                }}
                className="min-h-11 shrink-0 font-semibold text-rose-300 hover:text-rose-200"
              >
                {toast.action.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
