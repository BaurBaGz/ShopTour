import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { accountHome, safeNext } from "@/lib/auth/home";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.loginMeta };
}

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[]; confirm?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getT();
  const params = await searchParams;
  const next = safeNext(params.next);

  const user = await getSessionUser();
  if (user) redirect(next || (await accountHome(user.id)));

  const toAdmin = next.startsWith("/admin");
  const withNext = (href: string) => (next ? `${href}?next=${encodeURIComponent(next)}` : href);

  return (
    <main className="px-4 py-16 sm:py-20">
      {params.confirm === "expired" && (
        <p role="alert" className="mx-auto mb-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.auth.confirmExpired}
        </p>
      )}
      <AuthForm
        title={toAdmin ? t.auth.loginAdminTitle : t.auth.loginTitle}
        subtitle={
          toAdmin
            ? t.auth.loginAdminSubtitle
            : t.auth.loginSubtitle
        }
        submitLabel={t.nav.login}
        action={loginAction}
        hiddenFields={next ? { next } : undefined}
        fields={[
          {
            name: "email",
            label: t.auth.email,
            type: "email",
            placeholder: "you@example.com",
            required: true,
          },
          {
            name: "password",
            label: t.auth.password,
            type: "password",
            required: true,
          },
        ]}
        footer={
          <div className="flex flex-col items-center gap-1">
            <Link href="/auth/forgot" className="inline-flex min-h-11 items-center font-medium text-stone-600 hover:text-rose-600">
              {t.auth.forgot}
            </Link>
            {!toAdmin && (
              <>
                <p>
                  <span className="text-stone-500">{t.auth.noAccount} </span>
                  <Link href={withNext("/auth/signup")} className="inline-flex min-h-11 items-center font-medium text-rose-600 hover:text-rose-700">
                    {t.auth.signUp}
                  </Link>
                </p>
                <p>
                  <span className="text-stone-500">{t.auth.areYouStore} </span>
                  <Link href="/magazinam" className="inline-flex min-h-11 items-center font-medium text-stone-700 hover:text-rose-600">
                    {t.auth.connectStore}
                  </Link>
                </p>
              </>
            )}
          </div>
        }
      />
    </main>
  );
}
