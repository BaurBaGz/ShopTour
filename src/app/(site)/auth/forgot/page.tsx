import type { Metadata } from "next";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Восстановление пароля — ShopTour",
};

type ForgotPageProps = {
  searchParams: Promise<{ expired?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPageProps) {
  const { expired } = await searchParams;

  return (
    <main className="px-4 py-16 sm:py-20">
      {expired && (
        <p role="alert" className="mx-auto mb-4 max-w-md rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ссылка из письма устарела или уже использована. Запросите новое письмо.
        </p>
      )}
      <AuthForm
        title="Забыли пароль?"
        subtitle="Введите email, с которым входите в ShopTour. Пришлём письмо со ссылкой, чтобы задать новый пароль."
        submitLabel="Отправить письмо"
        action={forgotPasswordAction}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "shop@example.com",
            required: true,
          },
        ]}
        footer={
          <Link href="/auth/login" className="font-medium text-rose-600 hover:text-rose-700">
            ← Вернуться ко входу
          </Link>
        }
      />
    </main>
  );
}
