"use client";

import { BagIcon, ChartIcon, HomeIcon, PercentIcon, StoreIcon, TagIcon, UsersIcon } from "@/components/admin/admin-icons";
import { PanelShell, type PanelNavItem } from "@/components/panel/panel-shell";
import { ROLE_LABELS, type CabinetRole, type Permission } from "@/lib/auth/permissions";

const TITLES: [string, string][] = [
  ["/dashboard/reservations", "Брони"],
  ["/dashboard/products/new", "Новый товар"],
  ["/dashboard/products", "Товары"],
  ["/dashboard/promotions", "Акции"],
  ["/dashboard/analytics", "Статистика"],
  ["/dashboard/settings", "Магазин"],
  ["/dashboard/staff", "Сотрудники"],
  ["/dashboard/password", "Мой аккаунт"],
  ["/dashboard", "Главная"],
];

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
  const sections: (PanelNavItem & { permission?: Permission })[] = [
    { href: "/dashboard", label: "Главная", icon: HomeIcon },
    { href: "/dashboard/reservations", label: "Брони", icon: BagIcon, badge: waitingReservations, permission: "reservations" },
    { href: "/dashboard/products", label: "Товары", icon: TagIcon, permission: "products" },
    { href: "/dashboard/promotions", label: "Акции", icon: PercentIcon, permission: "promotions" },
    { href: "/dashboard/analytics", label: "Статистика", icon: ChartIcon, permission: "analytics" },
    { href: "/dashboard/settings", label: "Магазин", icon: StoreIcon, permission: "store" },
    { href: "/dashboard/staff", label: "Сотрудники", icon: UsersIcon, permission: "staff" },
  ];
  return (
    <PanelShell
      homeHref="/dashboard"
      brand="Магазин"
      nav={sections.filter((item) => !item.permission || permissions.includes(item.permission))}
      titles={TITLES}
      fallbackTitle="Кабинет"
      siteLink={{ href: `/s/${store.slug}`, label: "Открыть витрину" }}
      account={{ href: "/dashboard/password", name: store.name, note: `${ROLE_LABELS[role]} · ${email}` }}
      collapsedKey="shoptour:cabinet-sidebar-collapsed"
    >
      {children}
    </PanelShell>
  );
}
