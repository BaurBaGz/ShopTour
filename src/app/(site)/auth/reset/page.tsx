import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.resetMeta };
}

// Сюда ведёт ссылка из письма (через /auth/confirm, который уже выполнил вход)
export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  const t = await getT();

  return (
    <main className="px-4 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        {user ? (
          <>
            <p className="mb-3 text-sm text-stone-500">
              {t.auth.resetAccount} <span className="font-medium text-stone-900">{user.email}</span>
            </p>
            <ChangePasswordForm reset />
          </>
        ) : (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-stone-900">{t.auth.resetBrokenTitle}</h1>
            <p className="mt-2 text-sm text-stone-500">
              {t.auth.resetBrokenText}
            </p>
            <Link
              href="/auth/forgot"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              {t.auth.requestEmail}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
