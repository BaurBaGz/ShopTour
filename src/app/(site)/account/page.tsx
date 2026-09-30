import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(site)/auth/actions";
import { RecentProducts } from "@/components/account/recent-products";
import { AccountSummary, SavedTours, type SavedTour } from "@/components/account/saved-tours";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Мой аккаунт — ShopTour",
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/account");

  const supabase = await createClient();
  const [staff, store, toursResult] = await Promise.all([
    getStaffMember(),
    getStoreForOwner(user.id),
    supabase.from("saved_tours").select("id, name, store_ids, created_at").order("created_at", { ascending: false }),
  ]);
  if (toursResult.error) console.error("[account] tours:", toursResult.error.message);
  const rows = (toursResult.data ?? []) as { id: string; name: string; store_ids: string[]; created_at: string }[];

  // Названия магазинов для подписи маршрутов (скрытые магазины просто не попадут в подпись)
  const storeIds = [...new Set(rows.flatMap((t) => t.store_ids))];
  const { data: stores } = storeIds.length
    ? await supabase.from("stores").select("id, name").in("id", storeIds)
    : { data: [] as { id: string; name: string }[] };
  const names = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const tours: SavedTour[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    storeIds: t.store_ids,
    storeNames: t.store_ids.map((id) => names.get(id)).filter((n): n is string => Boolean(n)),
    createdAt: t.created_at,
  }));

  const displayName = typeof user.user_metadata?.name === "string" && user.user_metadata.name ? user.user_metadata.name : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-rose-600">Мой аккаунт</p>
          <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight text-stone-900">
            {displayName ? `Здравствуйте, ${displayName}` : "Здравствуйте!"}
          </h1>
          <p className="mt-1 truncate text-stone-500">{user.email}</p>
          <p className="mt-2 text-sm text-stone-500">Избранное и маршруты сохраняются в аккаунте — они одинаковые на телефоне и компьютере.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {staff && (
            <Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              Админка
            </Link>
          )}
          {store && (
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              Кабинет магазина
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="min-h-11 rounded-xl border border-stone-200 px-5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              Выйти
            </button>
          </form>
        </div>
      </div>

      <AccountSummary />

      <section id="tours" aria-labelledby="tours-title" className="scroll-mt-20">
        <h2 id="tours-title" className="text-xl font-semibold tracking-tight text-stone-900">
          Сохранённые маршруты
        </h2>
        <SavedTours tours={tours} />
      </section>

      <RecentProducts />

      <details className="group rounded-2xl border border-stone-200 bg-white">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-medium text-stone-700">
          Сменить пароль
          <span className="text-stone-400 transition group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="px-1 pb-1">
          <ChangePasswordForm />
        </div>
      </details>
    </main>
  );
}
