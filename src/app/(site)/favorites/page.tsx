import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites/favorites-list";

export const metadata: Metadata = {
  title: "Избранное — ShopTour",
  description: "Товары, которые вы отметили сердечком",
};

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Избранное
        </h1>
        <p className="mt-2 text-stone-500">
          Сохраняется в этом браузере — вход не нужен
        </p>
      </div>
      <FavoritesList />
    </main>
  );
}
