import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(site)/auth/actions";
import { DailyChart, PeriodTabs, StatCards, TopProductsTable } from "@/components/analytics/analytics-blocks";
import { ProductsManager, type ManagedProduct } from "@/components/dashboard/products-manager";
import { ReservationsPanel, type DashboardReservation } from "@/components/dashboard/reservations-panel";
import { StorefrontCard } from "@/components/dashboard/storefront-card";
import { getCategories, getProductsWithError } from "@/lib/data/catalog";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { getStoreAnalytics, parsePeriod } from "@/lib/data/analytics";
import { formatPhone, VISIT_LABELS } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/server";
import { telegramConfigured } from "@/lib/telegram";

export const metadata: Metadata = {
  title: "Личный кабинет — ShopTour",
};

type DashboardPageProps = { searchParams: Promise<{ period?: string }> };

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const store = await getStoreForOwner(user.id);
  // Без магазина — это покупатель: у него свой аккаунт
  if (!store) redirect("/account");

  const period = parsePeriod((await searchParams).period);
  const supabase = await createClient();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: products, errorMessage }, categories, stats, reservationsResult, notifyResult] = await Promise.all([
    getProductsWithError({ storeId: store.id, includeOutOfStock: true, includeHidden: true }),
    getCategories(),
    getStoreAnalytics(store.id, period),
    supabase
      .from("reservations")
      .select("id, product_name, size, price, customer_name, customer_phone, visit, comment, status, created_at")
      .eq("store_id", store.id)
      .gte("created_at", monthAgo)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("store_notifications").select("telegram_chat_id, telegram_name").eq("store_id", store.id).maybeSingle(),
  ]);

  // Сначала ждут ответа, затем отложенные, затем закрытые — новые выше
  const order = { new: 0, confirmed: 1, declined: 2, completed: 2, no_show: 2 } as const;
  type Row = Omit<DashboardReservation, "phone_label" | "visit_label"> & { visit: keyof typeof VISIT_LABELS };
  const reservations: DashboardReservation[] = ((reservationsResult.data ?? []) as Row[])
    .map((r) => ({ ...r, phone_label: formatPhone(r.customer_phone), visit_label: VISIT_LABELS[r.visit] }))
    .sort((a, b) => order[a.status] - order[b.status]);
  const telegram = {
    configured: telegramConfigured(),
    connectedAs: notifyResult.data?.telegram_chat_id ? (notifyResult.data.telegram_name ?? "подключено") : null,
  };

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const managed: ManagedProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    images: p.images ?? [],
    sizes: p.sizes ?? [],
    size_stock: p.size_stock,
    in_stock: p.in_stock,
    is_hidden: p.is_hidden,
    category: categoryMap[p.category_id] ?? null,
  }));
  const withPhoto = managed.filter((p) => p.images.length > 0).length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-28 pt-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-rose-600">Кабинет магазина</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">{store.name}</h1>
          <p className="mt-1 text-stone-500">
            {store.city}, {store.address}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/products/new"
            className="hidden min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-rose-600 sm:inline-flex"
          >
            + Добавить товар
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-4 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Профиль магазина
          </Link>
          <Link
            href="/dashboard/password"
            className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 px-4 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Сменить пароль
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-11 rounded-xl border border-stone-200 px-4 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Выйти
            </button>
          </form>
        </div>
      </div>

      {store.status === "draft" && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">Магазин на проверке</p>
          <p className="mt-1">
            Покупатели увидят магазин и его товары после одобрения командой ShopTour — обычно в течение дня. Пока
            можно добавить товары и фото, чтобы к публикации всё было готово.
          </p>
        </div>
      )}
      {store.status === "hidden" && (
        <div role="status" className="rounded-2xl border border-stone-200 bg-stone-100 px-5 py-4 text-sm text-stone-700">
          <p className="font-semibold text-stone-900">Магазин временно скрыт</p>
          <p className="mt-1">Покупатели его сейчас не видят. Чтобы вернуть магазин на сайт, свяжитесь с командой ShopTour.</p>
        </div>
      )}

      {store.latitude === null && (
        <Link
          href="/dashboard/settings"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 transition hover:bg-amber-100"
        >
          <span className="font-semibold">Поставьте точку на карте →</span> без неё покупатели не найдут вас в «Рядом со
          мной» и в маршрутах.
        </Link>
      )}

      <ReservationsPanel reservations={reservations} telegram={telegram} />

      <StorefrontCard slug={store.slug} published={store.status === "published"} />

      <section aria-labelledby="products-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="products-title" className="text-xl font-semibold tracking-tight text-stone-900">
            Товары
          </h2>
          <p className="text-sm text-stone-500">Продали — нажмите «−» у размера. Закончилось всё — «Снять с продажи».</p>
        </div>

        {errorMessage && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

        {managed.length > 0 && withPhoto < 5 && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
            Добавьте хотя бы 5 товаров с фото — так витрина выглядит живой и её чаще открывают. Сейчас с фото:{" "}
            {withPhoto}.
          </p>
        )}

        {managed.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-stone-800">Товаров пока нет</p>
            <p className="mt-2 text-sm text-stone-500">Сфотографируйте вещь, укажите цену и размеры — это займёт минуту.</p>
            <Link
              href="/dashboard/products/new"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-6 text-sm font-semibold text-white"
            >
              Добавить первый товар
            </Link>
          </div>
        ) : (
          <ProductsManager products={managed} />
        )}
      </section>

      <section aria-labelledby="stats-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="stats-title" className="text-xl font-semibold tracking-tight text-stone-900">
              Статистика
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Сколько покупателей смотрят ваш магазин на ShopTour. Ваши собственные просмотры не считаются.
            </p>
          </div>
          <PeriodTabs current={period} hrefFor={(d) => `/dashboard?period=${d}`} />
        </div>
        <StatCards
          cards={[
            { label: "Посетители", value: stats.totals.visitors, note: "смотрели магазин или товары" },
            { label: "Просмотры товаров", value: stats.totals.productViews },
            { label: "Страница магазина", value: stats.totals.storeViews, note: "открытий" },
            { label: "В избранное", value: stats.totals.favorites, note: "добавили ваши товары" },
          ]}
        />
        <DailyChart daily={stats.daily} metric="productViews" title="Просмотры по дням" />
        <TopProductsTable
          products={stats.topProducts}
          title="Популярные товары"
          hrefFor={(id) => `/products/${id}`}
          showStore={false}
        />
      </section>

      {/* На телефоне кнопка добавления всегда под рукой */}
      <Link
        href="/dashboard/products/new"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 flex min-h-12 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 sm:hidden"
      >
        + Добавить товар
      </Link>
    </main>
  );
}
