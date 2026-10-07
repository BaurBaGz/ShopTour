// Телефоны: код страны выбирается из списка, номер хранится и показывается в международном виде.
// Без серверных импортов — и для сервера, и для браузера.

/** Коды стран для выбора в формах; первым — Казахстан. Россия тоже +7, поэтому отдельной строки нет. */
export const COUNTRY_CODES: { code: string; flag: string; country: string }[] = [
  { code: "7", flag: "🇰🇿", country: "KZ / RU" },
  { code: "996", flag: "🇰🇬", country: "KG" },
  { code: "998", flag: "🇺🇿", country: "UZ" },
  { code: "992", flag: "🇹🇯", country: "TJ" },
  { code: "993", flag: "🇹🇲", country: "TM" },
  { code: "994", flag: "🇦🇿", country: "AZ" },
  { code: "995", flag: "🇬🇪", country: "GE" },
  { code: "374", flag: "🇦🇲", country: "AM" },
  { code: "375", flag: "🇧🇾", country: "BY" },
  { code: "90", flag: "🇹🇷", country: "TR" },
  { code: "86", flag: "🇨🇳", country: "CN" },
  { code: "82", flag: "🇰🇷", country: "KR" },
  { code: "971", flag: "🇦🇪", country: "AE" },
  { code: "49", flag: "🇩🇪", country: "DE" },
  { code: "44", flag: "🇬🇧", country: "GB" },
  { code: "1", flag: "🇺🇸", country: "US / CA" },
];

const CODES_LONGEST_FIRST = [...COUNTRY_CODES].map((c) => c.code).sort((a, b) => b.length - a.length);

/**
 * Номер → код страны и остальные цифры. Понимает старые записи без кода:
 * «8 701 …» и «701 …» — это Казахстан (+7).
 */
export function splitPhone(raw: string | null | undefined): { code: string; rest: string } {
  const value = (raw ?? "").trim();
  const digits = value.replace(/\D/g, "");
  if (!digits) return { code: "7", rest: "" };
  if (!value.startsWith("+")) {
    if (digits.length === 11 && digits.startsWith("8")) return { code: "7", rest: digits.slice(1) };
    if (digits.length === 10) return { code: "7", rest: digits };
  }
  // С «+» код страны указан явно — снимаем его, даже если номер ещё не дописан
  const code = CODES_LONGEST_FIRST.find((c) => digits.startsWith(c) && (value.startsWith("+") || digits.length > c.length + 5));
  return code ? { code, rest: digits.slice(code.length) } : { code: "7", rest: digits };
}

/** Только цифры с кодом страны («77011234567»); null — номер не похож на настоящий */
export function normalizePhone(raw: string | null | undefined): string | null {
  const { code, rest } = splitPhone(raw);
  const digits = code + rest;
  if (code === "7") return /^7\d{10}$/.test(digits) ? digits : null;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Для показа: «+7 701 123 45 67», «+996 555 123 456». Непонятный — как есть. */
export function displayPhone(raw: string): string {
  const { code, rest } = splitPhone(raw);
  if (!rest) return raw.trim();
  if (code === "7" && rest.length === 10) return `+7 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6, 8)} ${rest.slice(8)}`;
  // Группы по 3 цифры, последняя — до 4: «415 555 0101», «555 123 456»
  const groups: string[] = [];
  let left = rest;
  while (left.length > 4) {
    groups.push(left.slice(0, 3));
    left = left.slice(3);
  }
  if (left) groups.push(left);
  return `+${code} ${groups.join(" ")}`;
}

/** Для ссылки tel: — только цифры с плюсом */
export function telHref(raw: string): string {
  const { code, rest } = splitPhone(raw);
  return `tel:+${code}${rest}`;
}

/** Телефон магазина для сохранения: «+7 701 123 45 67»; пусто — null */
export function storePhone(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  return value ? displayPhone(value) : null;
}
