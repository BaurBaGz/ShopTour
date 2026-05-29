import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Регистрация магазина — ShopTour",
};

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <AuthForm
          title="Регистрация магазина"
          subtitle="Создайте аккаунт и добавьте свой магазин в ShopTour"
          submitLabel="Создать магазин"
          action={registerAction}
          fields={[
            {
              name: "storeName",
              label: "Название магазина *",
              placeholder: "Boutique Dostyk",
              required: true,
            },
            {
              name: "city",
              label: "Город *",
              placeholder: "Алматы",
              required: true,
            },
            {
              name: "address",
              label: "Адрес *",
              placeholder: "пр. Достык, 89",
              required: true,
            },
            {
              name: "phone",
              label: "Телефон",
              placeholder: "+7 727 000 00 00",
            },
            {
              name: "whatsapp",
              label: "WhatsApp (если другой номер)",
              placeholder: "+7 700 000 00 00",
            },
            {
              name: "description",
              label: "Описание магазина",
              placeholder: "Кратко о вашем бутике…",
            },
            {
              name: "email",
              label: "Email для входа *",
              type: "email",
              required: true,
            },
            {
              name: "password",
              label: "Пароль *",
              type: "password",
              required: true,
            },
          ]}
          footer={
            <>
              <span className="text-stone-500">Уже есть аккаунт? </span>
              <Link
                href="/auth/login"
                className="font-medium text-rose-600 hover:text-rose-700"
              >
                Войти
              </Link>
            </>
          }
        />
      </div>
    </main>
  );
}
