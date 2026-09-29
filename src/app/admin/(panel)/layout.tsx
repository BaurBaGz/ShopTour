import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = {
  title: "Админка — ShopTour",
  robots: { index: false, follow: false },
};

// Каждый запрос проверяет вход и роль на сервере; права на данные — ещё и в базе (RLS)
export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();

  return (
    <AdminShell staff={{ email: staff.email, name: staff.name, role: staff.role }}>
      {staff.must_change_password ? (
        // Новый сотрудник с временным паролем: сначала свой пароль, потом всё остальное
        <div className="mx-auto max-w-md">
          <ChangePasswordForm forced />
        </div>
      ) : (
        children
      )}
    </AdminShell>
  );
}
