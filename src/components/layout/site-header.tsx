import Link from "next/link";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { NavLink } from "@/components/layout/nav-link";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/stores", label: "Магазины на карте", shortLabel: "Карта" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  const [store, staff] = user
    ? await Promise.all([getStoreForOwner(user.id), getStaffMember()])
    : [null, null];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label="Shop Tour — на главную">
          {/* Логотип — только SVG из брендбука: не перекрашиваем и не набираем текстом */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/shoptour-logo-black.svg" alt="Shop Tour" width={124} height={36} className="h-7 w-auto sm:h-9" />
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          <FavoritesLink />

          {user ? (
            <>
              {staff && (
                <Link
                  href="/admin"
                  className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hidden whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 sm:inline-block sm:px-4 sm:text-sm"
                >
                  Админка
                </Link>
              )}
              {store && (
                <Link
                  href="/dashboard"
                  className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium sm:px-4 sm:text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  Кабинет
                </Link>
              )}
              <Link
                href="/account"
                aria-label="Мой аккаунт"
                title="Мой аккаунт"
                className="flex h-11 w-11 items-center justify-center rounded-full text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path strokeLinecap="round" d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] whitespace-nowrap rounded-full bg-stone-900 px-3 py-2 text-[13px] font-medium text-white transition hover:bg-rose-600 sm:bg-transparent sm:px-4 sm:text-sm sm:text-stone-600 sm:hover:bg-stone-100 sm:hover:text-stone-900"
              >
                Войти
              </Link>
              <Link
                href="/magazinam"
                className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hidden whitespace-nowrap rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 sm:inline-block"
              >
                Для магазинов
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
