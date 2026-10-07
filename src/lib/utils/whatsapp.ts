import { splitPhone } from "@/lib/utils/phone";

/** Ссылка wa.me из номера телефона или WhatsApp (код страны — как в номере, без кода — +7) */
export function buildWhatsAppUrl(phoneOrWhatsapp: string, message?: string): string {
  const { code, rest } = splitPhone(phoneOrWhatsapp);
  const base = `https://wa.me/${code}${rest}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
