import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Вход — ShopTour",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="px-4 py-16 sm:py-20">
      <AuthForm
        title="Вход для магазина"
        subtitle="Управляйте товарами и каталогом в личном кабинете"
        submitLabel="Войти"
        action={loginAction}
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
