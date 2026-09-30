import { createHash } from "node:crypto";

// Бот ShopTour для магазинов: брони и уведомления. Токен — только на сервере
// (переменная без NEXT_PUBLIC_, поэтому в браузер не попадает).

type InlineKeyboard = { inline_keyboard: { text: string; callback_data?: string; url?: string }[][] };

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
}

export function botUsername() {
  return process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "";
}

/** Секрет вебхука — производный от токена, чтобы не заводить ещё одну переменную */
export function webhookSecret() {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  return createHash("sha256").update(`shoptour-webhook:${token}`).digest("hex").slice(0, 48);
}

async function call<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { ok: boolean; result?: T; description?: string };
    if (!data.ok) {
      console.error(`[telegram] ${method}:`, data.description);
      return null;
    }
    return data.result ?? null;
  } catch (error) {
    console.error(`[telegram] ${method}:`, (error as Error).message);
    return null;
  }
}

/** Экранирование для parse_mode HTML */
export function esc(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function sendMessage(chatId: number, html: string, keyboard?: InlineKeyboard) {
  return call<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export function editMessage(chatId: number, messageId: number, html: string, keyboard?: InlineKeyboard) {
  return call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: keyboard ?? { inline_keyboard: [] },
  });
}

export function answerCallback(callbackId: string, text?: string) {
  return call("answerCallbackQuery", { callback_query_id: callbackId, ...(text ? { text } : {}) });
}

export function setWebhook(url: string) {
  return call("setWebhook", {
    url,
    secret_token: webhookSecret(),
    allowed_updates: ["message", "callback_query"],
  });
}
