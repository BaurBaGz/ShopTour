// Проверка, что ссылка на фото ведёт в наше хранилище (бакет media) и в папку этого магазина.
// Магазины загружают фото файлами; чужие ссылки ломаются и позволяют подсунуть что угодно.

export function isStoreMediaUrl(url: string, storeId: string, kind: "products" | "stores"): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  const prefix = `${base}/storage/v1/object/public/media/${kind}/${storeId}/`;
  return url.startsWith(prefix) && /^[0-9a-f-]{36}\.webp$/.test(url.slice(prefix.length));
}
