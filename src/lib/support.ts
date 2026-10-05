// Связь с командой ShopTour: куда магазины и покупатели пишут за помощью.

/** WhatsApp в международном формате, без «+» */
export const SUPPORT_WHATSAPP = "77078271035";
/** Как номер показывать людям */
export const SUPPORT_WHATSAPP_LABEL = "+7 707 827 10 35";
/** Telegram без «@» */
export const SUPPORT_TELEGRAM = "baurbagz";

export const supportWhatsAppUrl = (text?: string) =>
  `https://wa.me/${SUPPORT_WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export const supportTelegramUrl = () => `https://t.me/${SUPPORT_TELEGRAM}`;
