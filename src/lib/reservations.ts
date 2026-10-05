import { createAdminClient } from "@/lib/supabase/admin";
import { botMessages, type BotMessages } from "@/lib/i18n/bot";
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

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shoptour.kz";
}

/** Текст брони для магазина — на его языке */
export function reservationText(r: Reservation, m: BotMessages) {
  const lines = [
    `🛍 <b>${m.reservation}</b> — ${esc(r.product_name)}`,
    r.size ? m.size(esc(r.size)) : null,
    m.price(formatPrice(r.price)),
    "",
    m.customer(esc(r.customer_name)),
    m.phone(formatPhone(r.customer_phone)),
    m.comes[r.visit],
    r.comment ? m.comment(esc(r.comment)) : null,
    r.status !== "new" ? `\n${m.statusLine[r.status]}` : null,
  ];
  return lines.filter((line) => line !== null).join("\n");
}

/** Кнопки под сообщением: на новую бронь — ответить, на отложенную — отметить итог */
export function reservationKeyboard(r: Reservation, m: BotMessages) {
  const whatsapp = { text: "💬 WhatsApp", url: `https://wa.me/${r.customer_phone}` };
  if (r.status === "new") {
    return {
      inline_keyboard: [
        [
          { text: m.buttons.confirm, callback_data: `res:${r.id}:confirmed` },
          { text: m.buttons.decline, callback_data: `res:${r.id}:declined` },
        ],
        [whatsapp],
      ],
    };
  }
  if (r.status === "confirmed") {
    return {
      inline_keyboard: [
        [
          { text: m.buttons.completed, callback_data: `res:${r.id}:completed` },
          { text: m.buttons.noShow, callback_data: `res:${r.id}:no_show` },
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
    .select("telegram_chat_id, locale")
    .eq("store_id", r.store_id)
    .maybeSingle();
  if (!link?.telegram_chat_id) return false;
  const m = botMessages(link.locale);

  const sent = await sendMessage(
    link.telegram_chat_id,
    `${reservationText(r, m)}\n\n<a href="${siteUrl()}/dashboard/reservations">${m.allReservations}</a>`,
    reservationKeyboard(r, m),
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
    .select("telegram_chat_id, locale")
    .eq("store_id", r.store_id)
    .maybeSingle();
  if (!link?.telegram_chat_id) return;
  const m = botMessages(link.locale);
  await editMessage(
    link.telegram_chat_id,
    r.telegram_message_id,
    `${reservationText(r, m)}\n\n<a href="${siteUrl()}/dashboard/reservations">${m.allReservations}</a>`,
    reservationKeyboard(r, m),
  );
}
