// Сообщения Telegram-бота магазинам на трёх языках. Язык — тот, на котором был сайт,
// когда магазин подключал Telegram (store_notifications.locale).
import { parseLocale, type Locale } from "@/lib/i18n/config";
import type { ReservationStatus } from "@/types/database";

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
const s = (n: number, one: string, many: string) => (n === 1 ? one : many);

export type BotMessages = {
  reservation: string;
  size: (size: string) => string;
  price: (price: string) => string;
  customer: (name: string) => string;
  phone: (phone: string) => string;
  comes: Record<"today" | "tomorrow", string>;
  comment: (text: string) => string;
  statusLine: Record<Exclude<ReservationStatus, "new">, string>;
  allReservations: string;
  buttons: { confirm: string; decline: string; completed: string; noShow: string };
  answers: Record<Exclude<ReservationStatus, "new">, string>;
  notFound: string;
  alreadyMarked: string;
  startNoCode: string;
  linkExpired: string;
  linked: (store: string) => string;
  summary: {
    hello: (store: string) => string;
    visitors: (n: number) => string;
    views: (views: number, favorites: number) => string;
    noVisitors: string;
    reservations: (n: number) => string;
    waiting: (n: number) => string;
    top: (product: string, times: number) => string;
    productFallback: string;
    week: (n: number) => string;
    noPhoto: (n: number) => string;
    addMore: string;
    openCabinet: string;
    storeFallback: string;
  };
};

const ru: BotMessages = {
  reservation: "Бронь",
  size: (size) => `Размер: <b>${size}</b>`,
  price: (price) => `Цена: ${price}`,
  customer: (name) => `Покупатель: ${name}`,
  phone: (phone) => `Телефон: ${phone}`,
  comes: { today: "Придёт: <b>сегодня</b>", tomorrow: "Придёт: <b>завтра</b>" },
  comment: (text) => `Комментарий: ${text}`,
  statusLine: {
    confirmed: "✅ <b>Отложили</b> — покупатель видит это на сайте",
    declined: "❌ <b>Нет в наличии</b> — покупатель видит это на сайте",
    completed: "🛍 <b>Забрали</b>",
    no_show: "⌛ <b>Не пришли</b>",
  },
  allReservations: "Все брони в кабинете",
  buttons: { confirm: "✅ Отложили", decline: "❌ Нет в наличии", completed: "🛍 Забрали", noShow: "⌛ Не пришли" },
  answers: {
    confirmed: "Отлично! Покупатель увидит, что вещь отложена",
    declined: "Понятно, покупатель увидит, что вещи нет",
    completed: "Отмечено: забрали",
    no_show: "Отмечено: не пришли",
  },
  notFound: "Бронь не найдена",
  alreadyMarked: "Эта бронь уже отмечена",
  startNoCode:
    "Здравствуйте! Это бот ShopTour для магазинов.\n\nЧтобы получать брони, откройте кабинет магазина на shoptour.kz и нажмите «Подключить Telegram».",
  linkExpired: "Ссылка устарела. Откройте кабинет магазина и нажмите «Подключить Telegram» ещё раз.",
  linked: (store) =>
    `Готово! Брони магазина <b>${store}</b> будут приходить сюда.\n\nНа каждую бронь отвечайте кнопками «✅ Отложили» или «❌ Нет в наличии» — покупатель сразу увидит ответ на сайте.`,
  summary: {
    hello: (store) => `☀️ Доброе утро! <b>${store}</b> вчера на ShopTour:`,
    visitors: (n) => `👀 ${n} ${plural(n, "человек смотрел", "человека смотрели", "человек смотрели")} ваш магазин`,
    views: (views, favorites) => `👁 ${views} ${plural(views, "просмотр", "просмотра", "просмотров")} товаров · ❤️ ${favorites} в избранное`,
    noVisitors: "👀 Вчера посетителей не было",
    reservations: (n) => `🛍 ${n} ${plural(n, "бронь", "брони", "броней")}`,
    waiting: (n) => `(${n} ${plural(n, "ждёт", "ждут", "ждут")} ответа)`,
    top: (product, times) => `🔥 Чаще всего смотрели: ${product} — ${times} ${plural(times, "раз", "раза", "раз")}`,
    productFallback: "товар",
    week: (n) => `За 7 дней: ${n} ${plural(n, "человек", "человека", "человек")}`,
    noPhoto: (n) => `💡 ${n} ${plural(n, "товар", "товара", "товаров")} без фото — их почти не смотрят`,
    addMore: "💡 Добавьте больше товаров — витрина с 10+ вещами собирает заметно больше просмотров",
    openCabinet: "Открыть кабинет",
    storeFallback: "Ваш магазин",
  },
};

const kk: BotMessages = {
  reservation: "Брон",
  size: (size) => `Өлшемі: <b>${size}</b>`,
  price: (price) => `Бағасы: ${price}`,
  customer: (name) => `Сатып алушы: ${name}`,
  phone: (phone) => `Телефон: ${phone}`,
  comes: { today: "Келеді: <b>бүгін</b>", tomorrow: "Келеді: <b>ертең</b>" },
  comment: (text) => `Түсініктеме: ${text}`,
  statusLine: {
    confirmed: "✅ <b>Сақтап қойдық</b> — сатып алушы мұны сайттан көреді",
    declined: "❌ <b>Қолда жоқ</b> — сатып алушы мұны сайттан көреді",
    completed: "🛍 <b>Алып кетті</b>",
    no_show: "⌛ <b>Келмеді</b>",
  },
  allReservations: "Барлық брон кабинетте",
  buttons: { confirm: "✅ Сақтап қойдық", decline: "❌ Қолда жоқ", completed: "🛍 Алып кетті", noShow: "⌛ Келмеді" },
  answers: {
    confirmed: "Тамаша! Сатып алушы заттың сақтап қойылғанын көреді",
    declined: "Түсінікті, сатып алушы заттың жоқ екенін көреді",
    completed: "Белгіленді: алып кетті",
    no_show: "Белгіленді: келмеді",
  },
  notFound: "Брон табылмады",
  alreadyMarked: "Бұл брон белгіленіп қойған",
  startNoCode:
    "Сәлеметсіз бе! Бұл — дүкендерге арналған ShopTour боты.\n\nБрондарды алу үшін shoptour.kz сайтындағы дүкен кабинетін ашып, «Telegram-ды қосу» түймесін басыңыз.",
  linkExpired: "Сілтеме ескірген. Дүкен кабинетін ашып, «Telegram-ды қосу» түймесін қайта басыңыз.",
  linked: (store) =>
    `Дайын! <b>${store}</b> дүкенінің брондары осында келеді.\n\nӘр бронға «✅ Сақтап қойдық» немесе «❌ Қолда жоқ» түймелерімен жауап беріңіз — сатып алушы жауапты сайттан бірден көреді.`,
  summary: {
    hello: (store) => `☀️ Қайырлы таң! <b>${store}</b> кеше ShopTour-да:`,
    visitors: (n) => `👀 Дүкеніңізді ${n} адам қарады`,
    views: (views, favorites) => `👁 Тауарлар ${views} рет қаралды · ❤️ ${favorites} таңдаулыларға`,
    noVisitors: "👀 Кеше келуші болған жоқ",
    reservations: (n) => `🛍 ${n} брон`,
    waiting: (n) => `(${n} жауап күтуде)`,
    top: (product, times) => `🔥 Ең көп қаралған: ${product} — ${times} рет`,
    productFallback: "тауар",
    week: (n) => `7 күнде: ${n} адам`,
    noPhoto: (n) => `💡 ${n} тауар фотосыз — оларды қарамайды десе де болады`,
    addMore: "💡 Тауарды көбірек қосыңыз — 10-нан астам заты бар витрина әлдеқайда көп қаралады",
    openCabinet: "Кабинетті ашу",
    storeFallback: "Дүкеніңіз",
  },
};

const en: BotMessages = {
  reservation: "Reservation",
  size: (size) => `Size: <b>${size}</b>`,
  price: (price) => `Price: ${price}`,
  customer: (name) => `Shopper: ${name}`,
  phone: (phone) => `Phone: ${phone}`,
  comes: { today: "Coming: <b>today</b>", tomorrow: "Coming: <b>tomorrow</b>" },
  comment: (text) => `Comment: ${text}`,
  statusLine: {
    confirmed: "✅ <b>Set aside</b> — the shopper sees this on the site",
    declined: "❌ <b>Out of stock</b> — the shopper sees this on the site",
    completed: "🛍 <b>Picked up</b>",
    no_show: "⌛ <b>Not picked up</b>",
  },
  allReservations: "All reservations in the dashboard",
  buttons: { confirm: "✅ Set aside", decline: "❌ Out of stock", completed: "🛍 Picked up", noShow: "⌛ Not picked up" },
  answers: {
    confirmed: "Great! The shopper will see the item is set aside",
    declined: "Got it, the shopper will see the item is gone",
    completed: "Marked: picked up",
    no_show: "Marked: not picked up",
  },
  notFound: "Reservation not found",
  alreadyMarked: "This reservation is already marked",
  startNoCode:
    "Hello! This is the ShopTour bot for stores.\n\nTo receive reservations, open your store dashboard on shoptour.kz and tap “Connect Telegram”.",
  linkExpired: "The link has expired. Open your store dashboard and tap “Connect Telegram” again.",
  linked: (store) =>
    `Done! Reservations for <b>${store}</b> will arrive here.\n\nAnswer each one with the buttons “✅ Set aside” or “❌ Out of stock” — the shopper sees the answer on the site right away.`,
  summary: {
    hello: (store) => `☀️ Good morning! <b>${store}</b> on ShopTour yesterday:`,
    visitors: (n) => `👀 ${n} ${s(n, "person", "people")} viewed your store`,
    views: (views, favorites) => `👁 ${views} item ${s(views, "view", "views")} · ❤️ ${favorites} added to favorites`,
    noVisitors: "👀 No visitors yesterday",
    reservations: (n) => `🛍 ${n} ${s(n, "reservation", "reservations")}`,
    waiting: (n) => `(${n} waiting for an answer)`,
    top: (product, times) => `🔥 Most viewed: ${product} — ${times} ${s(times, "time", "times")}`,
    productFallback: "item",
    week: (n) => `In 7 days: ${n} ${s(n, "person", "people")}`,
    noPhoto: (n) => `💡 ${n} ${s(n, "item has", "items have")} no photo — they are almost never viewed`,
    addMore: "💡 Add more items — a storefront with 10+ items gets noticeably more views",
    openCabinet: "Open the dashboard",
    storeFallback: "Your store",
  },
};

const MESSAGES: Record<Locale, BotMessages> = { ru, kk, en };

/** Сообщения бота на языке магазина; неизвестный язык — русский */
export function botMessages(locale: unknown): BotMessages {
  return MESSAGES[parseLocale(locale)];
}
