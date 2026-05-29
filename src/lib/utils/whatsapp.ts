/** Ссылка wa.me из номера телефона или WhatsApp */
export function buildWhatsAppUrl(
  phoneOrWhatsapp: string,
  message?: string,
): string {
  let digits = phoneOrWhatsapp.replace(/\D/g, "");

  if (digits.startsWith("8") && digits.length === 11) {
    digits = "7" + digits.slice(1);
  }
  if (!digits.startsWith("7") && digits.length === 10) {
    digits = "7" + digits;
  }

  const base = `https://wa.me/${digits}`;
  if (!message) return base;

  return `${base}?text=${encodeURIComponent(message)}`;
}
