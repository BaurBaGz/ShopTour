import type { Metadata } from "next";
import Link from "next/link";
import { RecentProducts } from "@/components/account/recent-products";
import { FavoritesList } from "@/components/favorites/favorites-list";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Избранное — ShopTour",
  description: "Товары, которые вы отметили сердечком",
};

export default async function FavoritesPage() {
  const user = await getSessionUser();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Избранное
        </h1>
        <p className="mt-2 text-stone-500">
          {user ? (
            "Сохраняется в вашем аккаунте — одинаково на телефоне и компьютере"
          ) : (
            <>
              Сохраняется в этом браузере.{" "}
              <Link href="/auth/signup?next=/favorites" className="font-medium text-rose-600 hover:text-rose-700">
                Создайте аккаунт
              </Link>
              , чтобы избранное было на всех устройствах.
            </>
          )}
        </p>
      </div>
      <FavoritesList />
      <div className="mt-16">
        <RecentProducts limit={8} />
      </div>
    </main>
  );
}
