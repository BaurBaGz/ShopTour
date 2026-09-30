/** Телефон для показа: «87078271035», «+7(707)8271035» → «+7 707 827 10 35». Непонятный — как есть. */
export function displayPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  if (!/^7\d{10}$/.test(d)) return raw.trim();
  return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
}

/** Для ссылки tel: — только цифры с плюсом */
export function telHref(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("8")) d = "7" + d.slice(1);
  return `tel:+${d}`;
}
