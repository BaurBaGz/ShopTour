import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signupAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { accountHome, safeNext } from "@/lib/auth/home";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Регистрация — ShopTour",
};

type SignupPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const next = safeNext((await searchParams).next);

  const user = await getSessionUser();
  if (user) redirect(next || (await accountHome(user.id)));

  return (
    <main className="px-4 py-16 sm:py-20">
      <AuthForm
        title="Регистрация"
        subtitle="Избранное, маршруты и недавно просмотренное будут с вами на телефоне и компьютере. То, что вы уже сохранили в этом браузере, перенесётся в аккаунт."
        submitLabel="Создать аккаунт"
        action={signupAction}
        hiddenFields={next ? { next } : undefined}
        fields={[
          { name: "name", label: "Имя (необязательно)", placeholder: "Как к вам обращаться" },
          { name: "email", label: "Email", type: "email", placeholder: "you@example.com", required: true },
          { name: "password", label: "Пароль (не короче 8 символов)", type: "password", required: true },
        ]}
        footer={
          <>
            <span className="text-stone-500">Уже есть аккаунт? </span>
            <Link
              href={next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login"}
              className="inline-flex min-h-11 items-center font-medium text-rose-600 hover:text-rose-700"
            >
              Войти
            </Link>
          </>
        }
      />
    </main>
  );
}
