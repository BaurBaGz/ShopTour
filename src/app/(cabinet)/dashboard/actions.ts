"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStoreOwner } from "@/lib/auth/session";
import { isStoreMediaUrl } from "@/lib/media-url";
import { canMove, refreshTelegramMessage } from "@/lib/reservations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { botUsername, telegramConfigured } from "@/lib/telegram";
import type { ReservationStatus } from "@/types/database";
import { parseProductForm } from "@/lib/utils/product-form";

export type ProductActionState = {
  error?: string;
};

export async function saveProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    redirect("/auth/login");
  }

  const productId = String(formData.get("productId") ?? "").trim() || null;
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const payload = { store_id: store.id, ...parsed.fields };

  const supabase = await createClient();

  // Фото — только загруженные в папку этого магазина; уже стоявшие у товара ссылки не трогаем
  let keptImages: string[] = [];
  if (productId) {
    const { data: current } = await supabase
      .from("products")
      .select("images")
      .eq("id", productId)
      .eq("store_id", store.id)
      .maybeSingle();
    keptImages = current?.images ?? [];
  }
  if (payload.images.some((url) => !isStoreMediaUrl(url, store.id, "products") && !keptImages.includes(url))) {
    return { error: "Фото можно добавить только загрузкой файла — ссылки на другие сайты не принимаются" };
  }

  if (productId) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)
      .eq("store_id", store.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath("/catalog");
  revalidatePath(`/stores/${store.id}`);
  // «Сохранить и добавить ещё» — сразу пустая форма для следующей вещи
  redirect(!productId && formData.get("then") === "new" ? "/dashboard/products/new?added=1" : "/dashboard/products");
}

export async function deleteProductAction(productId: string) {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", store.id);

  revalidatePath("/dashboard", "layout");
  revalidatePath("/catalog");
  revalidatePath(`/stores/${store.id}`);
}

type QuickResult = { error?: string };

async function ownerStoreId(): Promise<string | null> {
  try {
    return (await requireStoreOwner()).store.id;
  } catch {
    return null;
  }
}

function revalidateStore(storeId: string, slug?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/catalog");
  revalidatePath(`/stores/${storeId}`);
  if (slug) revalidatePath(`/s/${slug}`);
}

/**
 * Остаток одного размера прямо из списка товаров: число — сколько штук, null — «есть» без счёта.
 * Для кнопок «−»/«+» и «нет/есть» в кабинете на телефоне.
 */
export async function setSizeStockAction(productId: string, size: string, stock: number | null): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  if (stock !== null && (!Number.isInteger(stock) || stock < 0 || stock > 9999)) return { error: "Неверный остаток" };

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("sizes, size_stock")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!product || !product.sizes.includes(size)) return { error: "Товар не найден" };

  const current =
    product.size_stock && typeof product.size_stock === "object" && !Array.isArray(product.size_stock)
      ? { ...(product.size_stock as Record<string, number>) }
      : {};
  if (stock === null) delete current[size];
  else current[size] = stock;

  const { error } = await supabase
    .from("products")
    .update({ size_stock: current })
    .eq("id", productId)
    .eq("store_id", storeId);
  if (error) return { error: error.message };
  revalidateStore(storeId);
  return {};
}

/** Весь товар «в наличии» / «нет в наличии» одним касанием */
export async function setInStockAction(productId: string, inStock: boolean): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ in_stock: inStock })
    .eq("id", productId)
    .eq("store_id", storeId);
  if (error) return { error: error.message };
  revalidateStore(storeId);
  return {};
}

export type SlugState = { error?: string; success?: string };

/** Свой короткий адрес витрины: shoptour.kz/s/<slug> */
export async function updateSlugAction(_prev: SlugState, formData: FormData): Promise<SlugState> {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    return { error: "Войдите в аккаунт магазина" };
  }
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(slug)) {
    return { error: "Только латинские буквы, цифры и дефис, от 3 до 40 символов" };
  }
  if (slug === store.slug) return { success: "Адрес не изменился" };

  const supabase = await createClient();
  const { error } = await supabase.from("stores").update({ slug }).eq("id", store.id);
  if (error) {
    if (error.code === "23505") return { error: "Этот адрес уже занят другим магазином — попробуйте другой" };
    return { error: error.message };
  }
  revalidateStore(store.id, store.slug);
  revalidatePath(`/s/${slug}`);
  return { success: "Адрес витрины изменён. Не забудьте обновить ссылку в Instagram." };
}

/** Ответ магазина на бронь из кабинета (то же, что кнопки в Telegram) */
export async function respondReservationAction(id: string, status: ReservationStatus): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", id)
    .eq("store_id", storeId)
    .maybeSingle();
  if (!current) return { error: "Бронь не найдена" };
  if (!canMove(current.status, status)) return { error: "Бронь уже в другом статусе — обновите страницу" };

  const { data: updated, error } = await supabase
    .from("reservations")
    .update({ status, answered_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", storeId)
    .select("*")
    .single();
  if (error || !updated) return { error: error?.message ?? "Не сохранилось" };
  await refreshTelegramMessage(updated);
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/reservations/${id}`);
  return {};
}

/** Ссылка «Подключить Telegram»: одноразовый код на 30 минут */
export async function createTelegramLinkAction(): Promise<{ url?: string; error?: string }> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  if (!telegramConfigured()) return { error: "Telegram пока не настроен" };
  const code = randomBytes(12).toString("base64url");
  const { error } = await createAdminClient()
    .from("store_notifications")
    .upsert({ store_id: storeId, link_code: code, link_code_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() });
  if (error) return { error: error.message };
  return { url: `https://t.me/${botUsername()}?start=${code}` };
}

export async function unlinkTelegramAction(): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  const { error } = await createAdminClient()
    .from("store_notifications")
    .update({ telegram_chat_id: null, telegram_name: null, linked_at: null, link_code: null, link_code_expires_at: null })
    .eq("store_id", storeId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return {};
}

export type StoreProfileState = { error?: string; success?: string };

/** Владелец сам меняет информацию о магазине (статус и адрес витрины — отдельно) */
export async function updateOwnStoreAction(_prev: StoreProfileState, formData: FormData): Promise<StoreProfileState> {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    return { error: "Войдите в аккаунт магазина" };
  }
  const text = (key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);
  const logo = text("logo_url", 500);
  const info = {
    name: text("name", 80),
    description: text("description", 1000) || null,
    city: text("city", 60) || "Алматы",
    address: text("address", 200),
    phone: text("phone", 30) || null,
    whatsapp: text("whatsapp", 30) || null,
    instagram: text("instagram", 100).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "") || null,
    // Логотип — только загруженный файл; прежний логотип остаётся как был
    logo_url: isStoreMediaUrl(logo, store.id, "stores") || (logo && logo === store.logo_url) ? logo : null,
  };
  if (!info.name || !info.address) return { error: "Заполните название и адрес" };

  const supabase = await createClient();
  const { error } = await supabase.from("stores").update(info).eq("id", store.id);
  if (error) return { error: error.message };
  revalidateStore(store.id, store.slug);
  revalidatePath("/stores");
  return { success: "Сохранено — покупатели уже видят новую информацию" };
}

/** Точка магазина на карте — без неё магазина нет в «Рядом» и в маршрутах */
export async function updateOwnLocationAction(latitude: number | null, longitude: number | null) {
  let store;
  try {
    ({ store } = await requireStoreOwner());
  } catch {
    return { error: "Войдите в аккаунт магазина" };
  }
  const valid = (v: number | null, min: number, max: number) => v === null || (Number.isFinite(v) && v >= min && v <= max);
  if ((latitude === null) !== (longitude === null) || !valid(latitude, 35, 60) || !valid(longitude, 40, 95)) {
    return { error: "Точка должна быть в Казахстане" };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("stores").update({ latitude, longitude }).eq("id", store.id);
  if (error) return { error: error.message };
  revalidateStore(store.id, store.slug);
  revalidatePath("/stores");
  return { error: null };
}

/** Включить/выключить утреннюю сводку в Telegram */
export async function setDailySummaryAction(enabled: boolean): Promise<QuickResult> {
  const storeId = await ownerStoreId();
  if (!storeId) return { error: "Войдите в аккаунт магазина" };
  const { error } = await createAdminClient().from("store_notifications").update({ daily_summary: enabled }).eq("store_id", storeId);
  if (error) return { error: error.message };
  return {};
}
