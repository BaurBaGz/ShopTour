import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { accountHome, safeNext } from "@/lib/auth/home";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.signupMeta };
}

type SignupPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const t = await getT();
  const next = safeNext((await searchParams).next);

  const user = await getSessionUser();
  if (user) redirect(next || (await accountHome(user.id)));

  return (
    <main className="px-4 py-16 sm:py-20">
      <AuthForm
        title={t.auth.signupTitle}
        subtitle={t.auth.signupSubtitle}
        submitLabel={t.auth.createAccount}
        action={signupAction}
        hiddenFields={next ? { next } : undefined}
        fields={[
          { name: "name", label: t.auth.nameOptional, placeholder: t.auth.namePlaceholder },
          { name: "email", label: t.auth.email, type: "email", placeholder: "you@example.com", required: true },
          { name: "password", label: t.auth.passwordMin, type: "password", required: true },
        ]}
        footer={
          <>
            <span className="text-stone-500">{t.auth.haveAccount} </span>
            <Link
              href={next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"}
              className="inline-flex min-h-11 items-center font-medium text-rose-600 hover:text-rose-700"
            >
              {t.nav.login}
            </Link>
          </>
        }
      />
    </main>
  );
}
