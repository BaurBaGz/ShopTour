import type { Metadata } from "next";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.forgotMeta };
}

type ForgotPageProps = {
  searchParams: Promise<{ expired?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPageProps) {
  const { expired } = await searchParams;
  const t = await getT();

  return (
    <main className="px-4 py-16 sm:py-20">
      {expired && (
        <p role="alert" className="mx-auto mb-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.auth.forgotExpired}
        </p>
      )}
      <AuthForm
        title={t.auth.forgotTitle}
        subtitle={t.auth.forgotSubtitle}
        submitLabel={t.auth.sendEmail}
        action={forgotPasswordAction}
        fields={[
          {
            name: "email",
            label: t.auth.email,
            type: "email",
            placeholder: "shop@example.com",
            required: true,
          },
        ]}
        footer={
          <Link href="/auth/login" className="font-medium text-rose-600 hover:text-rose-700">
            {t.auth.backToLogin}
          </Link>
        }
      />
    </main>
  );
}
