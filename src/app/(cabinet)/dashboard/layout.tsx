import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { CabinetShell } from "@/components/dashboard/cabinet-shell";
import { requireCabinetPage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Кабинет магазина — ShopTour",
  robots: { index: false, follow: false },
};

// Каждый запрос проверяет вход и магазин на сервере; права на данные — ещё и в базе (RLS)
export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const { user, store, role, permissions, mustChangePassword } = await requireCabinetPage();
  // Счётчик броней в меню — только тем, кому доступны брони
  let waiting = 0;
  if (permissions.includes("reservations")) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("status", "new");
    waiting = count ?? 0;
  }

  return (
    <CabinetShell store={{ name: store.name, slug: store.slug }} email={user.email ?? ""} role={role} permissions={permissions} waitingReservations={waiting}>
      {mustChangePassword ? (
        // Новый продавец с временным паролем: сначала свой пароль, потом всё остальное
        <div className="mx-auto max-w-md">
          <ChangePasswordForm forced />
        </div>
      ) : (
        children
      )}
    </CabinetShell>
  );
}
