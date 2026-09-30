import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Аккаунт удалён — ShopTour",
};

export default function AccountDeletedPage() {
  return (
    <main className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">Аккаунт удалён</h1>
        <p className="mt-2 text-sm text-stone-500">
          Мы удалили аккаунт вместе с избранным, маршрутами и историей просмотров. Каталогом и картой можно
          пользоваться и без аккаунта.
        </p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          В каталог
        </Link>
      </div>
    </main>
  );
}
