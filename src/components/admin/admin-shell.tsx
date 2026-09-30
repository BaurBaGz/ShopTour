"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { logoutAction } from "@/app/(site)/auth/actions";
import {
  ChartIcon,
  CloseIcon,
  ExternalIcon,
  GridIcon,
  HomeIcon,
  ImageIcon,
  MenuIcon,
  PanelIcon,
  StoreIcon,
  TagIcon,
  UsersIcon,
} from "@/components/admin/admin-icons";
import { cn } from "@/lib/utils/cn";
import type { StaffRole } from "@/types/database";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  /** Раздел ещё не готов — в меню с пометкой «скоро» */
  soon?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
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

// Свёрнутое меню запоминается в браузере
const COLLAPSED_KEY = "shoptour:admin-sidebar-collapsed";
const collapsedListeners = new Set<() => void>();
const readCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};
const setCollapsed = (value: boolean) => {
  try {
    window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // без хранилища — только до перезагрузки
  }
  collapsedListeners.forEach((l) => l());
};
const subscribeCollapsed = (l: () => void) => {
  collapsedListeners.add(l);
  return () => {
    collapsedListeners.delete(l);
  };
};

type AdminShellProps = {
  staff: { email: string; name: string | null; role: StaffRole };
  children: React.ReactNode;
};

export function AdminShell({ staff, children }: AdminShellProps) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Переход по меню на телефоне закрывает выдвижное меню
  useEffect(() => setDrawerOpen(false), [pathname]);

  const title = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"))?.[1] ?? "Админка";
  const displayName = staff.name || staff.email;
  const initial = displayName.trim().charAt(0).toUpperCase();
  const items = NAV.filter((item) => !item.adminOnly || staff.role === "admin");

  const nav = (compact: boolean) => (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Разделы админки">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        const content = (
          <>
            <Icon className="h-5 w-5 shrink-0" />
            {!compact && <span className="truncate">{item.label}</span>}
            {!compact && item.soon && (
              <span className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                скоро
              </span>
            )}
          </>
        );
        const className = cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
          compact && "justify-center px-0",
          active ? "bg-rose-50 text-rose-700" : "text-stone-700 hover:bg-stone-100",
          item.soon && "cursor-default text-stone-400 hover:bg-transparent",
        );
        return item.soon ? (
          <span key={item.href} className={className} title={compact ? `${item.label} — скоро` : undefined} aria-disabled>
            {content}
          </span>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={className}
            title={compact ? item.label : undefined}
            aria-current={active ? "page" : undefined}
          >
            {content}
          </Link>
        );
      })}

      <div className="my-2 border-t border-stone-100" />
      <Link
        href="/catalog"
        target="_blank"
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-100",
          compact && "justify-center px-0",
        )}
        title={compact ? "Открыть сайт" : undefined}
      >
        <ExternalIcon className="h-5 w-5 shrink-0" />
        {!compact && <span>Открыть сайт</span>}
      </Link>
    </nav>
  );

  const logo = (compact: boolean) => (
    <Link href="/admin" className="flex min-h-11 items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white">
        ST
      </span>
      {!compact && (
        <span className="text-base font-semibold tracking-tight text-stone-900">
          ShopTour <span className="font-normal text-stone-500">Админ</span>
        </span>
      )}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-stone-100">
      {/* Меню: компьютер */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-stone-200 bg-white transition-[width] duration-200 lg:flex",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-stone-100 px-4", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && logo(false)}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <PanelIcon className="h-5 w-5" />
          </button>
        </div>
        {nav(collapsed)}
      </aside>

      {/* Меню: телефон — выезжает слева */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Меню админки">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-label="Закрыть меню"
          />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-stone-100 px-4">
              {logo(false)}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Закрыть меню"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {nav(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Открыть меню"
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <h1 className="truncate text-base font-semibold text-stone-900 sm:text-lg">{title}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin/account"
              className="flex min-h-11 items-center gap-3 rounded-xl px-2 transition hover:bg-stone-100"
              title="Мой аккаунт"
            >
              <span className="hidden text-right sm:block">
                <span className="block max-w-48 truncate text-sm font-medium text-stone-900">{displayName}</span>
                <span className="block text-xs text-stone-500">{ROLE_LABELS[staff.role]}</span>
              </span>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-semibold text-rose-700"
                aria-hidden
              >
                {initial}
              </span>
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="min-h-11 rounded-xl px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
              >
                Выйти
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
