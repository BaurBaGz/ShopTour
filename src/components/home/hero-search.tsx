import Link from "next/link";

export function HeroSearch() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(225,29,72,0.12),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-rose-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-stone-600 ring-1 ring-stone-200 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Локальные магазины рядом с вами
        </p>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
          Найдите стиль
          <span className="block text-rose-600">в своём городе</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg text-stone-600">
          ShopTour собирает каталог одежды от независимых бутиков. Смотрите
          товары, узнавайте адреса и приходите в магазин.
        </p>

        <form
          action="/catalog"
          method="get"
          className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="hero-search">
            Поиск по каталогу
          </label>
          <input
            id="hero-search"
            name="q"
            type="search"
            placeholder="Платье, куртка, кроссовки…"
            className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-stone-900 shadow-sm outline-none ring-rose-500/0 transition placeholder:text-stone-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
          />
          <button
            type="submit"
            className="rounded-2xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
          >
            Найти
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition hover:bg-rose-700"
          >
            Смотреть каталог
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
          <span className="text-sm text-stone-500">
            Без доставки — покупка в магазине
          </span>
        </div>
      </div>
    </section>
  );
}
