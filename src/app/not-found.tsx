import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Страница не найдена — ShopTour",
  robots: { index: false },
};

// Любой несуществующий адрес сайта. Здесь нет общей шапки, поэтому логотип и ссылки — свои.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/catalog" aria-label="Shop Tour — в каталог">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/shoptour-logo-black.svg" alt="Shop Tour" width={124} height={36} className="h-9 w-auto" />
      </Link>
      <p className="mt-10 text-sm font-semibold text-rose-600">Ошибка 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">Такой страницы нет</h1>
      <p className="mt-2 text-stone-500">
        Возможно, ссылка устарела, товар сняли с продажи или в адресе опечатка.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-6 text-sm font-semibold text-white transition hover:bg-rose-600">
          В каталог
        </Link>
        <Link href="/stores" className="inline-flex min-h-11 items-center rounded-xl px-6 text-sm font-semibold text-stone-800 ring-1 ring-stone-200 transition hover:bg-white">
          Магазины на карте
        </Link>
      </div>
    </main>
  );
}
