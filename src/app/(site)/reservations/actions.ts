"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { normalizePhone, notifyStore } from "@/lib/reservations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSizeStock } from "@/lib/utils/product";

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

  const user = await getSessionUser();
  if (!user) return { error: "Войдите или создайте аккаунт, чтобы отложить вещь" };
  if (!UUID_RE.test(productId)) return { error: "Товар не найден" };
  if (!name) return { error: "Как к вам обращаться?" };
  if (!phone) return { error: "Введите номер телефона, например +7 701 123 45 67" };

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id, name, price, sizes, size_stock, in_stock, is_hidden, store:stores!products_store_id_fkey ( id, status )")
    .eq("id", productId)
    .maybeSingle();
  const store = (product?.store ?? null) as { id: string; status: string } | null;
  if (!product || !store || store.status !== "published" || product.is_hidden) return { error: "Товар недоступен" };
  if (!product.in_stock) return { error: "Товар закончился" };
  if (product.sizes.length > 0) {
    if (!size || !product.sizes.includes(size)) return { error: "Выберите размер" };
    if (getSizeStock(product, size) === 0) return { error: `Размер ${size} закончился` };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  // Лимиты считаем и по телефону, и по аккаунту: иначе один человек шлёт брони с разными номерами
  const { data: recent } = await admin
    .from("reservations")
    .select("id, product_id, size, status, created_at, customer_phone")
    .or(`customer_phone.eq.${phone},user_id.eq.${user.id}`)
    .gte("created_at", dayAgo);

  // Та же вещь уже ждёт — просто показываем её бронь
  const same = (recent ?? []).find(
    (r) =>
      r.customer_phone === phone &&
      r.product_id === productId &&
      (r.size ?? null) === size &&
      (r.status === "new" || r.status === "confirmed"),
  );
  if (same) redirect(`/reservations/${same.id}`);
  if ((recent ?? []).filter((r) => r.created_at >= hourAgo).length >= 3) {
    return { error: "Слишком много броней за час. Попробуйте позже или напишите магазину в WhatsApp." };
  }
  if ((recent ?? []).length >= 10) {
    return { error: "Слишком много броней за сутки. Попробуйте завтра или напишите магазину в WhatsApp." };
  }

  const { data: created, error } = await admin
    .from("reservations")
    .insert({
      store_id: store.id,
      product_id: product.id,
      product_name: product.name,
      size,
      price: product.price,
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
    return { error: "Не удалось отправить бронь. Попробуйте ещё раз." };
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
