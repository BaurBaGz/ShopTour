import type { Metadata } from "next";
import Link from "next/link";
import { RecentProducts } from "@/components/account/recent-products";
import { FavoritesList } from "@/components/favorites/favorites-list";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: `${t.favoritesPage.title} — ShopTour`, description: t.favoritesPage.metaDescription };
}

export default async function FavoritesPage() {
  const [user, t] = await Promise.all([getSessionUser(), getT()]);
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{t.favoritesPage.title}</h1>
        <p className="mt-2 text-stone-500">
          {user ? (
            t.favoritesPage.savedInAccount
          ) : (
            <>
              {t.favoritesPage.savedInBrowser}{" "}
              <Link href="/auth/signup?next=/favorites" className="font-medium text-rose-600 hover:text-rose-700">
                {t.favoritesPage.createAccount}
              </Link>
              {t.favoritesPage.createAccountAfter}
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
