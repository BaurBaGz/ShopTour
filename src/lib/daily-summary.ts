import { createAdminClient } from "@/lib/supabase/admin";
import { botMessages } from "@/lib/i18n/bot";
import { esc, sendMessage } from "@/lib/telegram";

// Утренняя сводка магазину в Telegram: что было вчера на ShopTour

const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Границы «вчера» и «последние 7 дней» по времени Алматы */
function ranges(now = Date.now()) {
  const day = (shift: number) => {
    const d = new Date(now + ALMATY_OFFSET_MS);
    d.setUTCDate(d.getUTCDate() - shift);
    return `${d.toISOString().slice(0, 10)}T00:00:00+05:00`;
  };
  return { yesterday: day(1), today: day(0), weekAgo: day(7) };
}

type EventRow = { store_id: string; type: string; visitor_id: string; product_id: string | null; created_at: string };

export type StoreSummary = {
  storeId: string;
  chatId: number;
  text: string;
  /** Вчера никого и нет броней без ответа — сообщение не шлём */
  empty: boolean;
};

/** Сводки для магазинов с подключённым Telegram (или для одного магазина) */
export async function buildSummaries(onlyStoreId?: string): Promise<StoreSummary[]> {
  const admin = createAdminClient();
  let linksQuery = admin
    .from("store_notifications")
    .select("store_id, telegram_chat_id, daily_summary, locale")
    .not("telegram_chat_id", "is", null)
    .eq("daily_summary", true);
  if (onlyStoreId) linksQuery = linksQuery.eq("store_id", onlyStoreId);
  const { data: links } = await linksQuery;
  if (!links?.length) return [];

  const storeIds = links.map((l) => l.store_id);
  const { yesterday, today, weekAgo } = ranges();

  // События за неделю — постранично (Supabase отдаёт не больше 1000 строк за раз)
  const events: EventRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("analytics_events")
      .select("store_id, type, visitor_id, product_id, created_at")
      .in("store_id", storeIds)
      .gte("created_at", weekAgo)
      .lt("created_at", today)
      .range(from, from + 999);
    if (error) {
      console.error("[summary] events:", error.message);
      break;
    }
    events.push(...((data ?? []) as EventRow[]));
    if (!data || data.length < 1000) break;
  }

  const [{ data: stores }, { data: products }, { data: reservations }] = await Promise.all([
    admin.from("stores").select("id, name").in("id", storeIds),
    admin.from("products").select("id, store_id, name, images, in_stock").in("store_id", storeIds),
    admin.from("reservations").select("store_id, status, created_at").in("store_id", storeIds).or(`status.eq.new,created_at.gte.${yesterday}`),
  ]);

  const yesterdayMs = Date.parse(yesterday);
  const todayMs = Date.parse(today);
  const productName = new Map((products ?? []).map((p) => [p.id, p.name]));

  return links.map((link) => {
    const storeEvents = events.filter((e) => e.store_id === link.store_id);
    const y = storeEvents.filter((e) => {
      const t = Date.parse(e.created_at);
      return t >= yesterdayMs && t < todayMs;
    });
    const visitors = new Set(y.map((e) => e.visitor_id)).size;
    const weekVisitors = new Set(storeEvents.map((e) => e.visitor_id)).size;
    const productViews = y.filter((e) => e.type === "product_view").length;
    const favorites = y.filter((e) => e.type === "favorite_add").length;

    const views = new Map<string, number>();
    for (const e of y) if (e.type === "product_view" && e.product_id) views.set(e.product_id, (views.get(e.product_id) ?? 0) + 1);
    const top = [...views.entries()].sort((a, b) => b[1] - a[1])[0];

    const storeReservations = (reservations ?? []).filter((r) => r.store_id === link.store_id);
    const newYesterday = storeReservations.filter((r) => {
      const t = Date.parse(r.created_at);
      return t >= yesterdayMs && t < todayMs;
    }).length;
    const pending = storeReservations.filter((r) => r.status === "new").length;

    const own = (products ?? []).filter((p) => p.store_id === link.store_id && p.in_stock);
    const noPhoto = own.filter((p) => !p.images?.length).length;
    // Сводка — на языке магазина
    const m = botMessages(link.locale).summary;
    const name = (stores ?? []).find((s) => s.id === link.store_id)?.name ?? m.storeFallback;

    const lines: string[] = [m.hello(esc(name)), ""];
    if (visitors > 0) {
      lines.push(m.visitors(visitors));
      lines.push(m.views(productViews, favorites));
    } else {
      lines.push(m.noVisitors);
    }
    if (newYesterday > 0 || pending > 0) {
      const parts = [m.reservations(newYesterday)];
      if (pending > 0) parts.push(m.waiting(pending));
      lines.push(parts.join(" "));
    }
    if (top && top[1] > 1) {
      lines.push("", m.top(esc(productName.get(top[0]) ?? m.productFallback), top[1]));
    }
    if (weekVisitors > visitors) {
      lines.push(m.week(weekVisitors));
    }
    if (noPhoto > 0) {
      lines.push("", m.noPhoto(noPhoto));
    } else if (own.length < 5) {
      lines.push("", m.addMore);
    }
    lines.push("", `<a href="https://www.shoptour.kz/dashboard">${m.openCabinet}</a>`);

    return {
      storeId: link.store_id,
      chatId: link.telegram_chat_id!,
      text: lines.join("\n"),
      empty: visitors === 0 && pending === 0,
    };
  });
}

/** Отправить сводки. force — даже пустые и повторно (для проверки) */
export async function sendSummaries(options: { storeId?: string; force?: boolean; dryRun?: boolean } = {}) {
  const admin = createAdminClient();
  const summaries = await buildSummaries(options.storeId);
  const { data: sentRecently } = await admin
    .from("store_notifications")
    .select("store_id, last_summary_at")
    .in("store_id", summaries.map((s) => s.storeId));
  const lastSent = new Map((sentRecently ?? []).map((r) => [r.store_id, r.last_summary_at]));

  const result = { sent: 0, skippedEmpty: 0, skippedRecent: 0, failed: 0, previews: [] as string[] };
  for (const summary of summaries) {
    if (!options.force && summary.empty) {
      result.skippedEmpty++;
      continue;
    }
    // Повторный запуск в тот же день (ретрай) не дублирует сообщение
    const last = lastSent.get(summary.storeId);
    if (!options.force && last && Date.now() - Date.parse(last) < 20 * 60 * 60 * 1000) {
      result.skippedRecent++;
      continue;
    }
    if (options.dryRun) {
      result.previews.push(summary.text);
      continue;
    }
    const ok = await sendMessage(summary.chatId, summary.text);
    if (!ok) {
      result.failed++;
      continue;
    }
    result.sent++;
    await admin.from("store_notifications").update({ last_summary_at: new Date().toISOString() }).eq("store_id", summary.storeId);
  }
  return result;
}
