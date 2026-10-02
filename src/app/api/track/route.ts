import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AnalyticsEventType, Database } from "@/types/database";

type EventInsert = Database["public"]["Tables"]["analytics_events"]["Insert"];

const TYPES = new Set<AnalyticsEventType>([
  "page_view",
  "product_view",
  "store_view",
  "favorite_add",
  "search",
  "banner_view",
  "banner_click",
]);

// Поисковые роботы, превью ссылок в мессенджерах, автотесты
const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|vkshare|curl|wget|python|node-fetch|axios/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VISITOR_RE = /^[a-z0-9-]{8,64}$/i;

const done = () => new NextResponse(null, { status: 204 });

const uuid = (value: unknown) => (typeof value === "string" && UUID_RE.test(value) ? value : null);

/**
 * Приём событий аналитики из браузера (navigator.sendBeacon).
 * Всегда отвечает 204: посетителю ошибки счётчика не важны.
 */
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_RE.test(userAgent)) return done();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return done();
  }

  const type = body.type as AnalyticsEventType;
  const visitorId = typeof body.visitorId === "string" ? body.visitorId : "";
  if (!TYPES.has(type) || !VISITOR_RE.test(visitorId)) return done();

  const event: EventInsert = { type, visitor_id: visitorId };

  if (typeof body.path === "string" && body.path.startsWith("/")) {
    event.path = body.path.split(/[?#]/)[0].slice(0, 200);
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[track]", (error as Error).message);
    return done();
  }

  // Привязываем событие к товару/магазину/баннеру только если они есть в базе
  if (type === "product_view" || type === "favorite_add") {
    const productId = uuid(body.productId);
    if (!productId) return done();
    const { data } = await admin.from("products").select("id, store_id").eq("id", productId).maybeSingle();
    if (!data) return done();
    event.product_id = data.id;
    event.store_id = data.store_id;
  } else if (type === "store_view") {
    const storeId = uuid(body.storeId);
    if (!storeId) return done();
    const { data } = await admin.from("stores").select("id").eq("id", storeId).maybeSingle();
    if (!data) return done();
    event.store_id = data.id;
  } else if (type === "banner_view" || type === "banner_click") {
    const bannerId = uuid(body.bannerId);
    if (!bannerId) return done();
    const { data } = await admin.from("banners").select("id").eq("id", bannerId).maybeSingle();
    if (!data) return done();
    event.banner_id = data.id;
  } else if (type === "search") {
    const query = typeof body.query === "string" ? body.query.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 100) : "";
    if (!query) return done();
    event.query = query;
    const results = Number(body.results);
    event.results = Number.isFinite(results) ? Math.max(0, Math.min(Math.round(results), 100000)) : null;
  }

  // Сотрудники не попадают в статистику, владелец и продавцы — в статистику своего магазина.
  // Сессию проверяем только при наличии cookie входа: у обычных посетителей её нет.
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (hasSession) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const [{ data: staff }, { data: ownStores }, { data: memberOf }] = await Promise.all([
        admin.from("staff").select("user_id").eq("user_id", user.id).maybeSingle(),
        admin.from("stores").select("id").eq("owner_id", user.id),
        admin.from("store_members").select("store_id").eq("user_id", user.id),
      ]);
      if (staff) return done();
      if (event.store_id && ownStores?.some((s) => s.id === event.store_id)) return done();
      if (event.store_id && memberOf?.some((m) => m.store_id === event.store_id)) return done();
    }
  }

  const { error } = await admin.from("analytics_events").insert(event);
  if (error) console.error("[track] insert:", error.message);
  return done();
}
