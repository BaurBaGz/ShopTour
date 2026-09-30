import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-semibold text-stone-900">ShopTour</p>
          <p className="mt-1 text-sm text-stone-500">
            Одежда от магазинов вашего города
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 text-sm text-stone-600">
          <Link href="/catalog" className="inline-flex min-h-11 items-center hover:text-stone-900">
            Каталог
          </Link>
          <Link href="/stores" className="inline-flex min-h-11 items-center hover:text-stone-900">
            Магазины на карте
          </Link>
          <Link href="/magazinam" className="inline-flex min-h-11 items-center hover:text-stone-900">
            Для магазинов
          </Link>
        </div>
      </div>
    </footer>
  );
}
