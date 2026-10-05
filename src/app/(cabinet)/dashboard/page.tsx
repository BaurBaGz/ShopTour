import { SupportContacts } from "@/components/layout/support-contacts";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { StorefrontCard } from "@/components/dashboard/storefront-card";
import type { Permission } from "@/lib/auth/permissions";
import { requireCabinetPage } from "@/lib/auth/session";
import { getStoreAnalytics } from "@/lib/data/analytics";
import { getStorePromotions } from "@/lib/data/promotions";
import { createClient } from "@/lib/supabase/server";
import { telegramConfigured } from "@/lib/telegram";
import { getAvailableSizes } from "@/lib/utils/product";

// Главная кабинета: сводка и то, что требует внимания; сами зоны — на своих страницах в меню
export default async function DashboardHomePage() {
  const { store, permissions } = await requireCabinetPage();
  const c = (await getT()).cabinet.home;
  const can = (permission: Permission) => permissions.includes(permission);
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

  // Карточки и замечания — только по тем зонам, куда у пользователя есть доступ
  const cards = [
    { show: can("reservations"), label: c.cardWaiting, value: waiting, note: c.cardWaitingNote, href: "/dashboard/reservations" },
    { show: can("products"), label: c.cardProducts, value: products.length, note: c.cardProductsNote(products.length - soldOut), href: "/dashboard/products" },
    { show: can("analytics"), label: c.cardVisitors, value: stats.totals.visitors, note: c.cardVisitorsNote, href: "/dashboard/analytics" },
    { show: can("promotions"), label: c.cardPromotions, value: promotions.length, note: c.cardPromotionsNote, href: "/dashboard/promotions" },
  ].filter((card) => card.show);

  // Что требует внимания — показываем только ненулевое
  const attention = [
    {
      count: can("reservations") ? waiting : 0,
      text: c.waiting(waiting),
      hint: c.waitingHint,
      href: "/dashboard/reservations",
    },
    {
      count: can("products") && products.length === 0 ? 1 : 0,
      text: c.firstProduct,
      hint: c.firstProductHint,
      href: "/dashboard/products/new",
    },
    {
      count: can("store") && store.latitude === null ? 1 : 0,
      text: c.setLocation,
      hint: c.setLocationHint,
      href: "/dashboard/settings",
    },
    {
      count: can("products") ? withoutPhoto : 0,
      text: c.noPhoto(withoutPhoto),
      hint: c.noPhotoHint,
      href: "/dashboard/products",
    },
    {
      count: can("products") ? soldOut : 0,
      text: c.soldOut(soldOut),
      hint: c.soldOutHint,
      href: "/dashboard/products",
    },
    {
      count: can("store") && can("reservations") && telegramConfigured() && !notifyResult.data?.telegram_chat_id ? 1 : 0,
      text: c.connectTelegram,
      hint: c.connectTelegramHint,
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
          <p className="font-semibold">{c.draftTitle}</p>
          <p className="mt-1">
            {c.draftText}
          </p>
        </div>
      )}
      {store.status === "hidden" && (
        <div role="status" className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-700">
          <p className="font-semibold text-stone-900">{c.hiddenTitle}</p>
          <p className="mt-1">{c.hiddenText}</p>
        </div>
      )}

{cards.length > 0 && (
              <section aria-label={c.summary} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-stone-300">
              <p className="text-sm text-stone-500">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{card.value}</p>
              <p className="mt-1 text-xs text-stone-500">{card.note}</p>
            </Link>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">{c.attention}</h2>
        {attention.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">{c.allGood}</p>
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
                  {c.open}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StorefrontCard slug={store.slug} published={store.status === "published"} canEdit={can("store")} />

      <SupportContacts />
    </div>
  );
}
