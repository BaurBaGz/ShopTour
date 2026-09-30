import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";

export const metadata: Metadata = {
  title: "Вход — ShopTour",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next: rawNext } = await searchParams;
  const next = typeof rawNext === "string" && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const user = await getSessionUser();
  if (user) redirect(next || ((await getStaffMember()) ? "/admin" : "/dashboard"));

  return (
    <main className="px-4 py-16 sm:py-20">
      <AuthForm
        title={next.startsWith("/admin") ? "Вход в админку" : "Вход для магазина"}
        subtitle="Управляйте товарами и каталогом в личном кабинете"
        submitLabel="Войти"
        action={loginAction}
        hiddenFields={next ? { next } : undefined}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "shop@example.com",
            required: true,
          },
          {
            name: "password",
            label: "Пароль",
            type: "password",
            required: true,
          },
        ]}
        footer={
          <>
            <Link
              href="/auth/forgot"
              className="mb-4 inline-flex min-h-11 items-center font-medium text-stone-600 hover:text-rose-600"
            >
              Забыли пароль?
            </Link>
            <br />
            <span className="text-stone-500">Нет аккаунта? </span>
            <Link
              href="/auth/register"
              className="font-medium text-rose-600 hover:text-rose-700"
            >
              Зарегистрировать магазин
            </Link>
          </>
        }
      />
    </main>
  );
}
