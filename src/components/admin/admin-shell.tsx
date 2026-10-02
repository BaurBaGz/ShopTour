"use client";

import { ChartIcon, GridIcon, HomeIcon, ImageIcon, StoreIcon, TagIcon, UsersIcon } from "@/components/admin/admin-icons";
import { PanelShell, type PanelNavItem } from "@/components/panel/panel-shell";
import type { StaffRole } from "@/types/database";

const NAV: (PanelNavItem & { adminOnly?: boolean })[] = [
  { href: "/admin", label: "Главная", icon: HomeIcon },
  { href: "/admin/partners", label: "Партнёры", icon: StoreIcon },
  { href: "/admin/products", label: "Товары", icon: TagIcon },
  { href: "/admin/categories", label: "Категории", icon: GridIcon },
  { href: "/admin/banners", label: "Баннеры", icon: ImageIcon },
  { href: "/admin/analytics", label: "Аналитика", icon: ChartIcon },
  { href: "/admin/staff", label: "Сотрудники", icon: UsersIcon, adminOnly: true },
];

const TITLES: [string, string][] = [
  ["/admin/analytics", "Аналитика"],
  ["/admin/banners/new", "Новый баннер"],
  ["/admin/banners", "Баннеры"],
  ["/admin/products/new", "Новый товар"],
  ["/admin/products", "Товары"],
  ["/admin/partners/new", "Новый партнёр"],
  ["/admin/partners", "Партнёры"],
  ["/admin/categories", "Категории"],
  ["/admin/staff", "Сотрудники"],
  ["/admin/account", "Мой аккаунт"],
  ["/admin", "Главная"],
];

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Администратор",
  moderator: "Модератор",
};

type AdminShellProps = {
  staff: { email: string; name: string | null; role: StaffRole };
  children: React.ReactNode;
};

export function AdminShell({ staff, children }: AdminShellProps) {
  return (
    <PanelShell
      homeHref="/admin"
      brand="Админ"
      nav={NAV.filter((item) => !item.adminOnly || staff.role === "admin")}
      titles={TITLES}
      fallbackTitle="Админка"
      siteLink={{ href: "/catalog", label: "Открыть сайт" }}
      account={{ href: "/admin/account", name: staff.name || staff.email, note: ROLE_LABELS[staff.role] }}
      collapsedKey="shoptour:admin-sidebar-collapsed"
    >
      {children}
    </PanelShell>
  );
}
