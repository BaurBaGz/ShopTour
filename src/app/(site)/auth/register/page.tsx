import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/(site)/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.registerMeta };
}

export default async function RegisterPage() {
  const t = await getT();
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <AuthForm
          title={t.auth.registerTitle}
          subtitle={t.auth.registerSubtitle}
          submitLabel={t.auth.createStore}
          action={registerAction}
          consent
          fields={[
            {
              name: "storeName",
              label: t.auth.storeName,
              placeholder: "Boutique Dostyk",
              required: true,
            },
            {
              name: "city",
              label: t.auth.city,
              placeholder: t.auth.cityPlaceholder,
              required: true,
            },
            {
              name: "address",
              label: t.auth.address,
              placeholder: t.auth.addressPlaceholder,
              required: true,
            },
            {
              name: "phone",
              label: t.auth.phone,
              placeholder: "+7 727 000 00 00",
            },
            {
              name: "whatsapp",
              label: t.auth.whatsapp,
              placeholder: "+7 700 000 00 00",
            },
            {
              name: "description",
              label: t.auth.storeDescription,
              placeholder: t.auth.storeDescriptionPlaceholder,
            },
            {
              name: "email",
              label: t.auth.emailForLogin,
              type: "email",
              required: true,
            },
            {
              name: "password",
              label: t.auth.passwordRequired,
              type: "password",
              required: true,
            },
          ]}
          footer={
            <>
              <span className="text-stone-500">{t.auth.haveAccount} </span>
              <Link
                href="/auth/login"
                className="font-medium text-rose-600 hover:text-rose-700"
              >
                {t.nav.login}
              </Link>
            </>
          }
        />
      </div>
    </main>
  );
}
