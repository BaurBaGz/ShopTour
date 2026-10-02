import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Fns = Database["public"]["Functions"];

/** Вызов SQL-функции сводки; права проверяет база (RLS) */
async function rpc<N extends keyof Fns>(name: N, args: Fns[N]["Args"]): Promise<Fns[N]["Returns"] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) console.error(`[analytics] ${name}:`, (error as { message: string }).message);
  return (data as Fns[N]["Returns"] | null) ?? null;
}

export const ANALYTICS_PERIODS = [7, 30, 90] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export function parsePeriod(value: string | undefined, fallback: AnalyticsPeriod = 30): AnalyticsPeriod {
  const n = Number(value);
  return (ANALYTICS_PERIODS as readonly number[]).includes(n) ? (n as AnalyticsPeriod) : fallback;
}

export type DailyPoint = {
  day: string;
  visitors: number;
  pageViews: number;
  productViews: number;
  storeViews: number;
  favorites: number;
};

export type AnalyticsTotals = {
  visitors: number;
  pageViews: number;
  productViews: number;
  storeViews: number;
  favorites: number;
};

export type TopProduct = {
  id: string;
  name: string;
  image: string | null;
  storeName: string | null;
  views: number;
  visitors: number;
  favorites: number;
};

// Казахстан — UTC+5 круглый год
const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Даты периода по времени Алматы: с 00:00 первого дня по сегодня */
function periodDays(days: number) {
  const todayAlmaty = new Date(Date.now() + ALMATY_OFFSET_MS);
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayAlmaty);
    d.setUTCDate(d.getUTCDate() - i);
    list.push(d.toISOString().slice(0, 10));
  }
  return { list, from: `${list[0]}T00:00:00+05:00` };
}

async function getDailyAndTotals(days: number, storeId: string | null) {
  const { list, from } = periodDays(days);
  const [dailyRows, visitors] = await Promise.all([
    rpc("analytics_daily", { p_from: from, p_store: storeId }),
    rpc("analytics_visitors", { p_from: from, p_store: storeId }),
  ]);

  const byDay = new Map((dailyRows ?? []).map((row) => [row.day, row]));
  // Дни без событий тоже нужны графику — заполняем нулями
  const daily: DailyPoint[] = list.map((day) => {
    const row = byDay.get(day);
    return {
      day,
      visitors: Number(row?.visitors ?? 0),
      pageViews: Number(row?.page_views ?? 0),
      productViews: Number(row?.product_views ?? 0),
      storeViews: Number(row?.store_views ?? 0),
      favorites: Number(row?.favorites ?? 0),
    };
  });

  const sum = (key: keyof Omit<DailyPoint, "day">) => daily.reduce((acc, p) => acc + p[key], 0);
  const totals: AnalyticsTotals = {
    visitors: Number(visitors ?? 0),
    pageViews: sum("pageViews"),
    productViews: sum("productViews"),
    storeViews: sum("storeViews"),
    favorites: sum("favorites"),
  };

  return { from, daily, totals };
}

async function getTopProducts(from: string, storeId: string | null, limit: number): Promise<TopProduct[]> {
  const rows = (await rpc("analytics_top_products", { p_from: from, p_store: storeId, p_limit: limit })) ?? [];
  if (rows.length === 0) return [];

  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, images, store:stores!products_store_id_fkey ( name )")
    .in("id", rows.map((r) => r.product_id));
  const info = new Map(
    ((products ?? []) as unknown as { id: string; name: string; images: string[] | null; store: { name: string } | null }[]).map(
      (p) => [p.id, p],
    ),
  );

  return rows.flatMap((r) => {
    const p = info.get(r.product_id);
    // Удалённый товар в топе не показываем
    if (!p) return [];
    return [
      {
        id: r.product_id,
        name: p.name,
        image: p.images?.[0] ?? null,
        storeName: p.store?.name ?? null,
        views: Number(r.views),
        visitors: Number(r.visitors),
        favorites: Number(r.favorites),
      },
    ];
  });
}

/** Вся статистика для раздела «Аналитика» в админке */
export async function getAdminAnalytics(days: AnalyticsPeriod) {
  const supabase = await createClient();
  const { from, daily, totals } = await getDailyAndTotals(days, null);

  const [topProducts, storeRowsResult, searchRows, bannerRowsResult] = await Promise.all([
    getTopProducts(from, null, 10),
    rpc("analytics_top_stores", { p_from: from, p_limit: 10 }),
    rpc("analytics_searches", { p_from: from, p_limit: 100 }),
    rpc("analytics_banners", { p_from: from }),
  ]);

  const storeRows = storeRowsResult ?? [];
  const bannerRows = bannerRowsResult ?? [];
  const [storesInfo, bannersInfo] = await Promise.all([
    storeRows.length
      ? supabase.from("stores").select("id, name").in("id", storeRows.map((r) => r.store_id))
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    // Все баннеры, чтобы показать и те, у которых ещё нет показов
    supabase.from("banners").select("id, title, is_active").order("sort_order").order("created_at"),
  ]);

  const storeNames = new Map((storesInfo.data ?? []).map((s) => [s.id, s.name]));
  const topStores = storeRows.flatMap((r) => {
    const name = storeNames.get(r.store_id);
    if (!name) return [];
    return [
      {
        id: r.store_id,
        name,
        storeViews: Number(r.store_views),
        productViews: Number(r.product_views),
        favorites: Number(r.favorites),
        visitors: Number(r.visitors),
      },
    ];
  });

  const searches = (searchRows ?? []).map((r) => ({
    query: r.query,
    searches: Number(r.searches),
    visitors: Number(r.visitors),
    zero: Number(r.zero),
  }));

  const bannerStats = new Map(bannerRows.map((r) => [r.banner_id, r]));
  const banners = (bannersInfo.data ?? []).map((b) => {
    const s = bannerStats.get(b.id);
    return { id: b.id, title: b.title, isActive: b.is_active, views: Number(s?.views ?? 0), clicks: Number(s?.clicks ?? 0) };
  });

  return {
    days,
    daily,
    totals,
    topProducts,
    topStores,
    popularSearches: searches.slice(0, 15),
    // Запросы, которые чаще всего ничего не находили: подсказка, каких товаров не хватает
    zeroSearches: searches.filter((s) => s.zero > 0).sort((a, b) => b.zero - a.zero).slice(0, 15),
    banners,
  };
}

/** Статистика магазина для кабинета партнёра (RLS отдаёт только события его магазина) */
export async function getStoreAnalytics(storeId: string, days: AnalyticsPeriod) {
  const { from, daily, totals } = await getDailyAndTotals(days, storeId);
  const topProducts = await getTopProducts(from, storeId, 5);
  return { days, daily, totals, topProducts };
}

export type StoreValue = {
  days: number;
  /** Нашли магазин внутри ShopTour: каталог, поиск, карта, скидки */
  foundVisitors: number;
  /** Пришли по ссылке извне: витрина в Instagram, мессенджеры, поисковик */
  ownLinkVisitors: number;
  whatsappClicks: number;
  phoneClicks: number;
  mapClicks: number;
  tourAdds: number;
  reservations: number;
  pickedUp: number;
  pickedUpSum: number;
  waitingPickup: number;
};

/** «Что дал ShopTour»: брони и нажатия, которые ведут покупателя в магазин */
export async function getStoreValue(storeId: string, days: number): Promise<StoreValue> {
  const { from } = periodDays(days);
  const row = (await rpc("store_value_summary", { p_store: storeId, p_from: from }))?.[0];
  return {
    days,
    foundVisitors: Number(row?.found_visitors ?? 0),
    ownLinkVisitors: Number(row?.own_link_visitors ?? 0),
    whatsappClicks: Number(row?.whatsapp_clicks ?? 0),
    phoneClicks: Number(row?.phone_clicks ?? 0),
    mapClicks: Number(row?.map_clicks ?? 0),
    tourAdds: Number(row?.tour_adds ?? 0),
    reservations: Number(row?.reservations ?? 0),
    pickedUp: Number(row?.picked_up ?? 0),
    pickedUpSum: Number(row?.picked_up_sum ?? 0),
    waitingPickup: Number(row?.waiting_pickup ?? 0),
  };
}
