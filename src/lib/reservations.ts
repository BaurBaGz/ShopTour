import { createAdminClient } from "@/lib/supabase/admin";
import { editMessage, esc, sendMessage } from "@/lib/telegram";
import { formatPrice } from "@/lib/utils/format";
import type { Database, ReservationStatus } from "@/types/database";

// Бронь размера: сообщение магазину в Telegram и ответы на него (кнопки в боте и кабинет)

export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

/** «8 701 123-45-67», «+7 (701) 1234567» → «77011234567»; иначе null */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits.length === 10) digits = "7" + digits;
  return /^7\d{10}$/.test(digits) ? digits : null;
}

/** «77011234567» → «+7 701 123 45 67» */
export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length === 11 ? `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : phone;
}

export const VISIT_LABELS = { today: "сегодня", tomorrow: "завтра" } as const;

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  new: "Ждёт ответа магазина",
  confirmed: "Магазин отложил",
  declined: "Нет в наличии",
  completed: "Забрали",
  no_show: "Не пришли",
};

const STATUS_LINES: Record<ReservationStatus, string> = {
  new: "",
  confirmed: "✅ <b>Отложили</b> — покупатель видит это на сайте",
  declined: "❌ <b>Нет в наличии</b> — покупатель видит это на сайте",
  completed: "🛍 <b>Забрали</b>",
  no_show: "⌛ <b>Не пришли</b>",
};

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shoptour.kz";
}

/** Текст брони для магазина */
export function reservationText(r: Reservation) {
  const lines = [
    `🛍 <b>Бронь</b> — ${esc(r.product_name)}`,
    r.size ? `Размер: <b>${esc(r.size)}</b>` : null,
    `Цена: ${formatPrice(r.price)}`,
    "",
    `Покупатель: ${esc(r.customer_name)}`,
    `Телефон: ${formatPhone(r.customer_phone)}`,
    `Придёт: <b>${VISIT_LABELS[r.visit]}</b>`,
    r.comment ? `Комментарий: ${esc(r.comment)}` : null,
    STATUS_LINES[r.status] ? `\n${STATUS_LINES[r.status]}` : null,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

/** Кнопки под сообщением: на новую бронь — ответить, на отложенную — отметить итог */
export function reservationKeyboard(r: Reservation) {
  const whatsapp = { text: "💬 WhatsApp", url: `https://wa.me/${r.customer_phone}` };
  if (r.status === "new") {
    return {
      inline_keyboard: [
        [
          { text: "✅ Отложили", callback_data: `res:${r.id}:confirmed` },
          { text: "❌ Нет в наличии", callback_data: `res:${r.id}:declined` },
        ],
        [whatsapp],
      ],
    };
  }
  if (r.status === "confirmed") {
    return {
      inline_keyboard: [
        [
          { text: "🛍 Забрали", callback_data: `res:${r.id}:completed` },
          { text: "⌛ Не пришли", callback_data: `res:${r.id}:no_show` },
        ],
        [whatsapp],
      ],
    };
  }
  return { inline_keyboard: [[whatsapp]] };
}

/** Какие ответы допустимы из текущего состояния */
export function canMove(from: ReservationStatus, to: ReservationStatus) {
  if (from === "new") return to === "confirmed" || to === "declined";
  if (from === "confirmed") return to === "completed" || to === "no_show";
  return false;
}

/** Отправить новую бронь магазину в Telegram (если он подключил бота) */
export async function notifyStore(r: Reservation) {
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("store_notifications")
    .select("telegram_chat_id")
    .eq("store_id", r.store_id)
    .maybeSingle();
  if (!link?.telegram_chat_id) return false;

  const sent = await sendMessage(
    link.telegram_chat_id,
    `${reservationText(r)}\n\n<a href="${siteUrl()}/dashboard">Все брони в кабинете</a>`,
    reservationKeyboard(r),
  );
  if (!sent) return false;
  await admin.from("reservations").update({ telegram_message_id: sent.message_id }).eq("id", r.id);
  return true;
}

/** После ответа (в боте или в кабинете) — обновить сообщение в Telegram */
export async function refreshTelegramMessage(r: Reservation) {
  if (!r.telegram_message_id) return;
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("store_notifications")
    .select("telegram_chat_id")
    .eq("store_id", r.store_id)
    .maybeSingle();
  if (!link?.telegram_chat_id) return;
  await editMessage(
    link.telegram_chat_id,
    r.telegram_message_id,
    `${reservationText(r)}\n\n<a href="${siteUrl()}/dashboard">Все брони в кабинете</a>`,
    reservationKeyboard(r),
  );
}
