import Link from "next/link";
import { StorefrontCard } from "@/components/dashboard/storefront-card";
import { requireCabinetPage } from "@/lib/auth/session";
import { getStoreAnalytics } from "@/lib/data/analytics";
import { getStorePromotions } from "@/lib/data/promotions";
import { createClient } from "@/lib/supabase/server";
import { telegramConfigured } from "@/lib/telegram";
import { getAvailableSizes } from "@/lib/utils/product";

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

// Главная кабинета: сводка и то, что требует внимания; сами зоны — на своих страницах в меню
export default async function DashboardHomePage() {
  const { store, role } = await requireCabinetPage();
  const owner = role === "owner";
  const supabase = await createClient();
  const [productsResult, waitingResult, notifyResult, stats, promotions] = await Promise.all([
    supabase.from("products").select("id, images, sizes, size_stock, in_stock").eq("store_id", store.id),
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("store_id", store.id).eq("status", "new"),
    supabase.from("store_notifications").select("telegram_chat_id").eq("store_id", store.id).maybeSingle(),
    getStoreAnalytics(store.id, 7),
    getStorePromotions(store.id),
  ]);

  const products = productsResult.data ?? [];
  const soldOut = products.filter((p) => !p.in_stock || (p.sizes.length > 0 && getAvailableSizes(p).length === 0)).length;
  const withoutPhoto = products.filter((p) => !p.images?.length).length;
  const waiting = waitingResult.count ?? 0;

  const cards = [
    { label: "Брони ждут ответа", value: waiting, note: "ответьте в течение часа", href: "/dashboard/reservations" },
    { label: "Товары", value: products.length, note: `в наличии: ${products.length - soldOut}`, href: "/dashboard/products" },
    { label: "Посетители", value: stats.totals.visitors, note: "за 7 дней", href: "/dashboard/analytics" },
    { label: "Акции", value: promotions.length, note: "действуют сейчас", href: "/dashboard/promotions" },
  ];

  // Что требует внимания — показываем только ненулевое
  const attention = [
    {
      count: waiting,
      text: `${plural(waiting, "бронь", "брони", "броней")} ${plural(waiting, "ждёт", "ждут", "ждут")} ответа`,
      hint: "Покупатель видит ответ сразу — чем быстрее, тем чаще приходят",
      href: "/dashboard/reservations",
    },
    {
      count: products.length === 0 ? 1 : 0,
      text: "Добавьте первый товар",
      hint: "Сфотографируйте вещь, укажите цену и размеры — это займёт минуту",
      href: "/dashboard/products/new",
    },
    {
      count: owner && store.latitude === null ? 1 : 0,
      text: "Поставьте точку на карте",
      hint: "Без неё покупатели не найдут вас в «Рядом со мной» и в маршрутах",
      href: "/dashboard/settings",
    },
    {
      count: withoutPhoto,
      text: `${plural(withoutPhoto, "товар", "товара", "товаров")} без фото`,
      hint: "Карточку без фото почти не открывают",
      href: "/dashboard/products",
    },
    {
      count: soldOut,
      text: `${plural(soldOut, "товар", "товара", "товаров")} нет в наличии`,
      hint: "Все размеры закончились или товар снят с продажи",
      href: "/dashboard/products",
    },
    {
      count: owner && telegramConfigured() && !notifyResult.data?.telegram_chat_id ? 1 : 0,
      text: "Подключите Telegram",
      hint: "Брони будут приходить в чат, отвечать можно одной кнопкой",
      href: "/dashboard/reservations",
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <p className="text-stone-500">
        {store.name} · {store.city}, {store.address}
      </p>

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
        <div role="status" className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700">
          <p className="font-semibold text-stone-900">Магазин временно скрыт</p>
          <p className="mt-1">Покупатели его сейчас не видят. Чтобы вернуть магазин на сайт, свяжитесь с командой ShopTour.</p>
        </div>
      )}

      <section aria-label="Сводка" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300">
            <p className="text-sm text-stone-500">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{card.value}</p>
            <p className="mt-1 text-xs text-stone-500">{card.note}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Требует внимания</h2>
        {attention.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Всё в порядке — замечаний нет.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {attention.map((item) => (
              <li key={item.text} className="flex items-start gap-4 py-3">
                <span className="min-w-12 rounded-lg bg-amber-50 px-2 py-1 text-center text-sm font-semibold tabular-nums text-amber-800">
                  {item.count}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{item.text}</p>
                  <p className="text-sm text-stone-500">{item.hint}</p>
                </div>
                <Link href={item.href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-rose-700 hover:text-rose-800">
                  Открыть →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StorefrontCard slug={store.slug} published={store.status === "published"} canEdit={owner} />
    </div>
  );
}
