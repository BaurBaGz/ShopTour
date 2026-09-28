/** Ссылка на профиль из «@handle», «handle» или полного URL */
export function buildInstagramUrl(instagram: string): string {
  return instagram.startsWith("http")
    ? instagram
    : `https://instagram.com/${instagram.replace("@", "")}`;
}
