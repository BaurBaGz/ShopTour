import { createAdminClient } from "@/lib/supabase/admin";
import { botMessages, type BotMessages } from "@/lib/i18n/bot";
import { editMessage, esc, sendMessage } from "@/lib/telegram";
import { formatPrice } from "@/lib/utils/format";
import { displayPhone } from "@/lib/utils/phone";
import type { Database, ReservationStatus } from "@/types/database";

// Бронь размера: сообщение магазину в Telegram и ответы на него (кнопки в боте и кабинет)

export type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

// Телефоны — общие правила сайта (код страны, показ)
export { normalizePhone } from "@/lib/utils/phone";

/** «77011234567» → «+7 701 123 45 67», «996555123456» → «+996 555 123 456» */
export function formatPhone(phone: string) {
  return displayPhone(`+${phone.replace(/\D/g, "")}`);
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
    `${r.kind === "fitting" ? "🪡" : "🛍"} <b>${r.kind === "fitting" ? m.fitting : m.reservation}</b> — ${esc(r.product_name)}`,
    r.size ? m.size(esc(r.size)) : null,
    r.event_date ? m.eventDate(r.event_date.split("-").reverse().join(".")) : null,
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
