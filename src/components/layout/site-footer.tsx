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
        <div className="flex gap-6 text-sm text-stone-600">
          <Link href="/catalog" className="hover:text-stone-900">
            Каталог
          </Link>
        </div>
      </div>
    </footer>
  );
}
