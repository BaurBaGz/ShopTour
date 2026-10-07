"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { normalizePhone, notifyStore } from "@/lib/reservations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isForRent, isForSale, rentPrice } from "@/lib/rental";
import { almatyToday, getSizeStock } from "@/lib/utils/product";

export type ReserveState = { error?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Покупатель просит отложить размер. Только для вошедших; от спама — ещё и лимиты по телефону. */
export async function createReservationAction(_prev: ReserveState, formData: FormData): Promise<ReserveState> {
  const productId = String(formData.get("productId") ?? "");
  const size = String(formData.get("size") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const visit = formData.get("visit") === "tomorrow" ? "tomorrow" : "today";
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 300) || null;
  // Запись на примерку (прокат) или бронь для покупки
  const kind = formData.get("kind") === "fitting" ? "fitting" : "reserve";
  const eventDate = kind === "fitting" ? String(formData.get("eventDate") ?? "").trim() || null : null;

  const t = await getT();
  const user = await getSessionUser();
  if (!user) return { error: t.reserve.errorLogin };
  if (!UUID_RE.test(productId)) return { error: t.reserve.errorNotFound };
  if (!name) return { error: t.reserve.errorName };
  if (!phone) return { error: t.reserve.errorPhone };
  if (eventDate !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(eventDate))) return { error: t.rent.errorEventDate };
    if (eventDate < almatyToday()) return { error: t.rent.errorEventPast };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, name, price, listing, rent_price, sizes, size_stock, in_stock, is_hidden, is_draft, store:stores!products_store_id_fkey ( id, status )")
    .eq("id", productId)
    .maybeSingle();
  const store = (product?.store ?? null) as { id: string; status: string } | null;
  if (!product || !store || store.status !== "published" || product.is_hidden || product.is_draft) return { error: t.reserve.errorUnavailable };
  if (!product.in_stock) return { error: t.reserve.errorSoldOut };
  if (kind === "fitting" ? !isForRent(product) : !isForSale(product)) {
    return { error: kind === "fitting" ? t.rent.errorNotForRent : t.reserve.errorUnavailable };
  }
  if (product.sizes.length > 0) {
    if (!size || !product.sizes.includes(size)) return { error: t.reserve.errorChooseSize };
    if (getSizeStock(product, size) === 0) return { error: t.reserve.errorSizeSoldOut(size) };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // Лимиты считаем и по телефону, и по аккаунту: иначе один человек шлёт брони с разными номерами
  const { data: recent } = await admin
    .from("reservations")
    .select("id, product_id, size, status, created_at, customer_phone, kind")
    .or(`customer_phone.eq.${phone},user_id.eq.${user.id}`)
    .gte("created_at", dayAgo);

  // Та же вещь уже ждёт — просто показываем её бронь
  const same = (recent ?? []).find(
    (r) =>
      r.customer_phone === phone &&
      r.product_id === productId &&
      (r.size ?? null) === size &&
      (r.kind ?? "reserve") === kind &&
      (r.status === "new" || r.status === "confirmed"),
  );
  if (same) redirect(`/reservations/${same.id}`);
  if ((recent ?? []).filter((r) => r.created_at >= hourAgo).length >= 3) {
    return { error: t.reserve.errorTooManyHour };
  }
  if ((recent ?? []).length >= 10) {
    return { error: t.reserve.errorTooManyDay };
  }

  const { data: created, error } = await admin
    .from("reservations")
    .insert({
      store_id: store.id,
      product_id: product.id,
      product_name: product.name,
      size,
      // У записи на примерку — цена проката за сутки
      price: Math.round(kind === "fitting" ? rentPrice(product) : product.price),
      kind,
      event_date: eventDate,
      customer_name: name,
      customer_phone: phone,
      visit,
      comment,
      user_id: user.id,
    })
    .select("*")
    .single();
  if (error || !created) {
    console.error("[reserve] insert:", error?.message);
    return { error: t.reserve.errorFailed };
  }

  // Магазину — в Telegram; если бот не подключён, бронь ждёт в кабинете
  await notifyStore(created);

  // Имя и телефон — в аккаунт: в следующий раз подставятся на любом устройстве
  const meta = user.user_metadata ?? {};
  if (meta.contact_phone !== phone || (!meta.name && !meta.full_name)) {
    const supabase = await createClient();
    await supabase.auth.updateUser({ data: { contact_phone: phone, ...(meta.name || meta.full_name ? {} : { name }) } });
  }
  redirect(`/reservations/${created.id}`);
}
