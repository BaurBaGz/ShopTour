"use client";

import { BagIcon, ChartIcon, HomeIcon, PercentIcon, StoreIcon, TagIcon, UsersIcon } from "@/components/admin/admin-icons";
import { PanelShell, type PanelNavItem } from "@/components/panel/panel-shell";
import type { CabinetRole, Permission } from "@/lib/auth/permissions";
import { useT } from "@/lib/i18n/client";

type CabinetShellProps = {
  store: { name: string; slug: string };
  email: string;
  role: CabinetRole;
  /** Доступы пользователя — в меню только его разделы */
  permissions: Permission[];
  /** Брони, которые ждут ответа, — число в меню */
  waitingReservations: number;
  children: React.ReactNode;
};

/** Кабинет магазина — тот же каркас, что у админки: меню слева, у каждой зоны своя страница */
export function CabinetShell({ store, email, role, permissions, waitingReservations, children }: CabinetShellProps) {
  const shell = useT().cabinet;
  const titles: [string, string][] = [
    ["/dashboard/reservations", shell.shell.reservations],
    ["/dashboard/products/new", shell.shell.newProduct],
    ["/dashboard/products", shell.shell.products],
    ["/dashboard/promotions", shell.shell.promotions],
    ["/dashboard/analytics", shell.shell.analytics],
    ["/dashboard/settings", shell.shell.store],
    ["/dashboard/staff", shell.shell.staff],
    ["/dashboard/password", shell.shell.account],
    ["/dashboard", shell.shell.home],
  ];
  const sections: (PanelNavItem & { permission?: Permission })[] = [
    { href: "/dashboard", label: shell.shell.home, icon: HomeIcon },
    { href: "/dashboard/reservations", label: shell.shell.reservations, icon: BagIcon, badge: waitingReservations, permission: "reservations" },
    { href: "/dashboard/products", label: shell.shell.products, icon: TagIcon, permission: "products" },
    { href: "/dashboard/promotions", label: shell.shell.promotions, icon: PercentIcon, permission: "promotions" },
    { href: "/dashboard/analytics", label: shell.shell.analytics, icon: ChartIcon, permission: "analytics" },
    { href: "/dashboard/settings", label: shell.shell.store, icon: StoreIcon, permission: "store" },
    { href: "/dashboard/staff", label: shell.shell.staff, icon: UsersIcon, permission: "staff" },
  ];
  return (
    <PanelShell
      homeHref="/dashboard"
      brand={shell.shell.brand}
      nav={sections.filter((item) => !item.permission || permissions.includes(item.permission))}
      titles={titles}
      fallbackTitle={shell.shell.fallbackTitle}
      siteLink={{ href: `/s/${store.slug}`, label: shell.shell.openStorefront }}
      account={{ href: "/dashboard/password", name: store.name, note: `${shell.roles[role]} · ${email}` }}
      collapsedKey="shoptour:cabinet-sidebar-collapsed"
    >
      {children}
    </PanelShell>
  );
}
