import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { accountHome, safeNext } from "@/lib/auth/home";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Вход — ShopTour",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[]; confirm?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
          Ссылка подтверждения устарела или уже использована. Попробуйте войти — если email ещё не подтверждён, мы
          отправим новое письмо.
        </p>
      )}
      <AuthForm
        title={toAdmin ? "Вход в админку" : "Вход в ShopTour"}
        subtitle={
          toAdmin
            ? "Для сотрудников ShopTour"
            : "Покупателям — избранное и маршруты на всех устройствах. Магазинам — личный кабинет."
        }
        submitLabel="Войти"
        action={loginAction}
        hiddenFields={next ? { next } : undefined}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "you@example.com",
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
          <div className="flex flex-col items-center gap-1">
            <Link href="/auth/forgot" className="inline-flex min-h-11 items-center font-medium text-stone-600 hover:text-rose-600">
              Забыли пароль?
            </Link>
            {!toAdmin && (
              <>
                <p>
                  <span className="text-stone-500">Нет аккаунта? </span>
                  <Link href={withNext("/auth/signup")} className="inline-flex min-h-11 items-center font-medium text-rose-600 hover:text-rose-700">
                    Зарегистрироваться
                  </Link>
                </p>
                <p>
                  <span className="text-stone-500">Вы магазин? </span>
                  <Link href="/magazinam" className="inline-flex min-h-11 items-center font-medium text-stone-700 hover:text-rose-600">
                    Подключить магазин
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
