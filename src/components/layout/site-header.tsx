import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { FavoritesLink } from "@/components/favorites/favorites-link";
import { NavLink } from "@/components/layout/nav-link";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/stores", label: "Магазины на карте", shortLabel: "Карта" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  const store = user ? await getStoreForOwner(user.id) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-h-11 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white transition group-hover:bg-rose-600">
            ST
          </span>
          <span className="hidden text-lg font-semibold tracking-tight text-stone-900 sm:inline">
            ShopTour
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-2">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          <FavoritesLink />

          {user && store ? (
            <>
              <Link
                href="/dashboard"
                className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium sm:px-4 sm:text-sm text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                Кабинет
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <button
                  type="submit"
                  className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium sm:px-4 sm:text-sm text-stone-500 hover:bg-stone-100"
                >
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] hidden whitespace-nowrap rounded-full sm:inline-block px-2 py-2 text-[13px] font-medium sm:px-4 sm:text-sm text-stone-600 transition hover:bg-stone-100"
              >
                Вход
              </Link>
              <Link
                href="/auth/register"
                className="relative after:absolute after:inset-x-0 after:-inset-y-1 after:content-[''] whitespace-nowrap rounded-full bg-stone-900 px-2.5 py-2 text-[13px] font-medium sm:px-4 sm:text-sm text-white transition hover:bg-rose-600"
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
