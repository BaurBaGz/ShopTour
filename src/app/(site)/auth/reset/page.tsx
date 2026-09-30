import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Новый пароль — ShopTour",
};

// Сюда ведёт ссылка из письма (через /auth/confirm, который уже выполнил вход)
export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <main className="px-4 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        {user ? (
          <>
            <p className="mb-3 text-sm text-stone-500">
              Аккаунт: <span className="font-medium text-stone-900">{user.email}</span>
            </p>
            <ChangePasswordForm reset />
          </>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-stone-900">Ссылка не сработала</h1>
            <p className="mt-2 text-sm text-stone-500">
              Возможно, она устарела или уже использована. Запросите новое письмо.
            </p>
            <Link
              href="/auth/forgot"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Запросить письмо
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
