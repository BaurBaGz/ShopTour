import type { Metadata } from "next";
import { CabinetShell } from "@/components/dashboard/cabinet-shell";
import { requireOwnerPage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Кабинет магазина — ShopTour",
  robots: { index: false, follow: false },
};

// Каждый запрос проверяет вход и магазин на сервере; права на данные — ещё и в базе (RLS)
export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const { user, store } = await requireOwnerPage();
  const supabase = await createClient();
  const { count } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("status", "new");

  return (
    <CabinetShell store={{ name: store.name, slug: store.slug }} email={user.email ?? ""} waitingReservations={count ?? 0}>
      {children}
    </CabinetShell>
  );
}
