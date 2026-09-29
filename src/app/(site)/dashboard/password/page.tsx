import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Смена пароля — ShopTour" };

export default async function DashboardPasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/password");

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link href="/dashboard" className="-mx-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        ← Кабинет
      </Link>
      <div className="mt-4">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
