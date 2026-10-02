"use client";

import { BagIcon, ChartIcon, HomeIcon, PercentIcon, StoreIcon, TagIcon } from "@/components/admin/admin-icons";
import { PanelShell, type PanelNavItem } from "@/components/panel/panel-shell";

const TITLES: [string, string][] = [
  ["/dashboard/reservations", "Брони"],
  ["/dashboard/products/new", "Новый товар"],
  ["/dashboard/products", "Товары"],
  ["/dashboard/promotions", "Акции"],
  ["/dashboard/analytics", "Статистика"],
  ["/dashboard/settings", "Магазин"],
  ["/dashboard/password", "Мой аккаунт"],
  ["/dashboard", "Главная"],
];

type CabinetShellProps = {
  store: { name: string; slug: string };
  email: string;
  /** Брони, которые ждут ответа, — число в меню */
  waitingReservations: number;
  children: React.ReactNode;
};

/** Кабинет магазина — тот же каркас, что у админки: меню слева, у каждой зоны своя страница */
export function CabinetShell({ store, email, waitingReservations, children }: CabinetShellProps) {
  const nav: PanelNavItem[] = [
    { href: "/dashboard", label: "Главная", icon: HomeIcon },
    { href: "/dashboard/reservations", label: "Брони", icon: BagIcon, badge: waitingReservations },
    { href: "/dashboard/products", label: "Товары", icon: TagIcon },
    { href: "/dashboard/promotions", label: "Акции", icon: PercentIcon },
    { href: "/dashboard/analytics", label: "Статистика", icon: ChartIcon },
    { href: "/dashboard/settings", label: "Магазин", icon: StoreIcon },
  ];
  return (
    <PanelShell
      homeHref="/dashboard"
      brand="Магазин"
      nav={nav}
      titles={TITLES}
      fallbackTitle="Кабинет"
      siteLink={{ href: `/s/${store.slug}`, label: "Открыть витрину" }}
      account={{ href: "/dashboard/password", name: store.name, note: email }}
      collapsedKey="shoptour:cabinet-sidebar-collapsed"
    >
      {children}
    </PanelShell>
  );
}
