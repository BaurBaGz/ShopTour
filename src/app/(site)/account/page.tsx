import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(site)/auth/actions";
import { RecentProducts } from "@/components/account/recent-products";
import { DeleteAccount } from "@/components/account/delete-account";
import { PendingReserve } from "@/components/account/pending-reserve";
import { AccountSummary, SavedTours, type SavedTour } from "@/components/account/saved-tours";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { getCabinet, getSessionUser } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils/format";
import type { ReservationStatus } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${(await getT()).account.title} — ShopTour` };
}

type AccountPageProps = { searchParams: Promise<{ welcome?: string }> };

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { welcome } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/account");

  const t = await getT();
  const supabase = await createClient();
  const [staff, store, toursResult, reservationsResult] = await Promise.all([
    getStaffMember(),
    getCabinet(user.id),
    supabase.from("saved_tours").select("id, name, store_ids, created_at").order("created_at", { ascending: false }),
    supabase
      .from("reservations")
      .select("id, product_name, size, price, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const myReservations = (reservationsResult.data ?? []) as {
    id: string;
    product_name: string;
    size: string | null;
    price: number;
    status: ReservationStatus;
    created_at: string;
  }[];
  if (toursResult.error) console.error("[account] tours:", toursResult.error.message);
  const rows = (toursResult.data ?? []) as { id: string; name: string; store_ids: string[]; created_at: string }[];

  // Названия магазинов для подписи маршрутов (скрытые магазины просто не попадут в подпись)
  const storeIds = [...new Set(rows.flatMap((row) => row.store_ids))];
  const { data: stores } = storeIds.length
    ? await supabase.from("stores").select("id, name").in("id", storeIds)
    : { data: [] as { id: string; name: string }[] };
  const names = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const tours: SavedTour[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    storeIds: row.store_ids,
    storeNames: row.store_ids.map((id) => names.get(id)).filter((n): n is string => Boolean(n)),
    createdAt: row.created_at,
  }));

  const displayName = typeof user.user_metadata?.name === "string" && user.user_metadata.name ? user.user_metadata.name : null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-rose-600">{t.account.title}</p>
          <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight text-stone-900">
            {displayName ? t.account.helloName(displayName) : t.account.hello}
          </h1>
          <p className="mt-1 truncate text-stone-500">{user.email}</p>
          <p className="mt-2 text-sm text-stone-500">{t.account.syncNote}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {staff && (
            <Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              {t.nav.admin}
            </Link>
          )}
          {store && (
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-5 text-sm font-medium text-stone-700 hover:bg-stone-50">
              {t.account.storeCabinet}
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit" className="min-h-11 rounded-xl border border-stone-200 px-5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              {t.account.logout}
            </button>
          </form>
        </div>
      </div>

      {welcome && (
        <p role="status" className="-mt-4 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          {t.account.welcome}
        </p>
      )}

      <PendingReserve />

      <AccountSummary />

      {myReservations.length > 0 && (
        <section aria-labelledby="my-reservations" className="flex flex-col gap-3">
          <h2 id="my-reservations" className="text-xl font-semibold tracking-tight text-stone-900">
            {t.account.myReservations}
          </h2>
          <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {myReservations.map((r) => (
              <li key={r.id}>
                <Link href={`/reservations/${r.id}`} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-stone-900">
                      {r.product_name}
                      {r.size ? `, ${r.size}` : ""}
                    </span>
                    <span className="text-sm text-stone-500">{formatPrice(r.price)}</span>
                  </span>
                  <span
                    className={
                      r.status === "confirmed"
                        ? "shrink-0 text-sm font-medium text-emerald-700"
                        : r.status === "new"
                          ? "shrink-0 text-sm font-medium text-amber-700"
                          : "shrink-0 text-sm text-stone-500"
                    }
                  >
                    {t.reservation.status[r.status].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="tours" aria-labelledby="tours-title" className="scroll-mt-20">
        <h2 id="tours-title" className="text-xl font-semibold tracking-tight text-stone-900">
          {t.account.savedRoutes}
        </h2>
        <SavedTours tours={tours} />
      </section>

      <RecentProducts />

      <details className="group rounded-2xl border border-stone-200 bg-white">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-medium text-stone-700">
          {t.account.changePassword}
          <span className="text-stone-400 transition group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="px-1 pb-1">
          <ChangePasswordForm />
        </div>
      </details>

      {/* Сотрудникам и магазинам удаление недоступно — сайт объяснит почему */}
      {!staff && !store && <DeleteAccount />}
    </main>
  );
}
