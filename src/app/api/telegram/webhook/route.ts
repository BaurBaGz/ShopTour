import { NextResponse, type NextRequest } from "next/server";
import { canMove, refreshTelegramMessage } from "@/lib/reservations";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerCallback, esc, sendMessage, webhookSecret } from "@/lib/telegram";
import type { ReservationStatus } from "@/types/database";

type Update = {
  message?: { chat: { id: number; first_name?: string; title?: string; username?: string }; text?: string };
  callback_query?: { id: string; data?: string; message?: { chat: { id: number } } };
};

const ok = () => NextResponse.json({ ok: true });
const STATUSES: ReservationStatus[] = ["confirmed", "declined", "completed", "no_show"];
const ANSWERS: Record<string, string> = {
  confirmed: "Отлично! Покупатель увидит, что вещь отложена",
  declined: "Понятно, покупатель увидит, что вещи нет",
  completed: "Отмечено: забрали",
  no_show: "Отмечено: не пришли",
};

/** Бот ShopTour: привязка магазина (/start <код>) и ответы на брони кнопками */
export async function POST(request: NextRequest) {
  if (request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret()) {
    return new NextResponse(null, { status: 401 });
  }
  const update = (await request.json().catch(() => null)) as Update | null;
  if (!update) return ok();
  const admin = createAdminClient();

  // /start <код> — магазин нажал «Подключить Telegram» в кабинете
  const message = update.message;
  if (message?.text?.startsWith("/start")) {
    const code = message.text.split(/\s+/)[1];
    const chat = message.chat;
    if (!code) {
      await sendMessage(
        chat.id,
        "Здравствуйте! Это бот ShopTour для магазинов.\n\nЧтобы получать брони, откройте кабинет магазина на shoptour.kz и нажмите «Подключить Telegram».",
      );
      return ok();
    }
    const { data: link } = await admin
      .from("store_notifications")
      .select("store_id, link_code_expires_at")
      .eq("link_code", code)
      .maybeSingle();
    if (!link || !link.link_code_expires_at || Date.parse(link.link_code_expires_at) < Date.now()) {
      await sendMessage(chat.id, "Ссылка устарела. Откройте кабинет магазина и нажмите «Подключить Telegram» ещё раз.");
      return ok();
    }
    await admin
      .from("store_notifications")
      .update({
        telegram_chat_id: chat.id,
        telegram_name: chat.username ? `@${chat.username}` : (chat.title ?? chat.first_name ?? null),
        linked_at: new Date().toISOString(),
        link_code: null,
        link_code_expires_at: null,
      })
      .eq("store_id", link.store_id);
    const { data: store } = await admin.from("stores").select("name").eq("id", link.store_id).maybeSingle();
    await sendMessage(
      chat.id,
      `Готово! Брони магазина <b>${esc(store?.name ?? "")}</b> будут приходить сюда.\n\nНа каждую бронь отвечайте кнопками «✅ Отложили» или «❌ Нет в наличии» — покупатель сразу увидит ответ на сайте.`,
    );
    return ok();
  }

  // Кнопки под бронью
  const callback = update.callback_query;
  if (callback?.data?.startsWith("res:")) {
    const [, id, status] = callback.data.split(":") as [string, string, ReservationStatus];
    const chatId = callback.message?.chat.id;
    const { data: reservation } = await admin.from("reservations").select("*").eq("id", id).maybeSingle();
    // Отвечать может только чат этого магазина
    const { data: link } = reservation
      ? await admin.from("store_notifications").select("telegram_chat_id").eq("store_id", reservation.store_id).maybeSingle()
      : { data: null };
    if (!reservation || !STATUSES.includes(status) || !link || link.telegram_chat_id !== chatId) {
      await answerCallback(callback.id, "Бронь не найдена");
      return ok();
    }
    if (!canMove(reservation.status, status)) {
      await refreshTelegramMessage(reservation);
      await answerCallback(callback.id, "Эта бронь уже отмечена");
      return ok();
    }
    const { data: updated } = await admin
      .from("reservations")
      .update({ status, answered_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (updated) await refreshTelegramMessage(updated);
    await answerCallback(callback.id, ANSWERS[status]);
    return ok();
  }

  return ok();
}
