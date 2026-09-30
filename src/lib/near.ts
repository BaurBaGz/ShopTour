// «Рядом со мной»: точка покупателя, радиус в минутах пешком, расстояния до магазинов.
// Без серверных импортов — используется и на сервере, и в браузере.
import { distanceKm, type Point } from "@/lib/utils/route";

/** Сколько минут пешком можно выбрать; пусто — без ограничения, только сортировка */
export const WALK_OPTIONS = [5, 10, 15, 30] as const;
export const DEFAULT_WALK = 15;

const WALKING_SPEED_KMH = 4.5;
/** По улицам путь длиннее, чем по прямой, — примерно на четверть */
const STREET_FACTOR = 1.25;

/** Точка из адреса страницы: «43.238,76.889». Только окрестности Казахстана. */
export function parseNear(value?: string): Point | null {
  const match = value?.match(/^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (lat < 35 || lat > 60 || lng < 40 || lng > 95) return null;
  return { lat, lng };
}

/** Для адреса страницы: ~100 м точности — достаточно для «рядом» и не выдаёт точный адрес */
export function formatNear(point: Point): string {
  return `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
}

export function parseWalk(value?: string): number | null {
  const n = Number(value);
  return (WALK_OPTIONS as readonly number[]).includes(n) ? n : null;
}

/** Примерное время пешком по улицам, мин */
export function walkMinutesTo(km: number): number {
  return Math.max(1, Math.round(((km * STREET_FACTOR) / WALKING_SPEED_KMH) * 60));
}

/** Какое расстояние по прямой укладывается в столько минут пешком, км */
export function maxKmForWalk(minutes: number): number {
  return (minutes / 60) * WALKING_SPEED_KMH / STREET_FACTOR;
}

export function distanceToStore(
  from: Point,
  store: { latitude: number | null; longitude: number | null } | null | undefined,
): number | null {
  if (!store || store.latitude === null || store.longitude === null) return null;
  return distanceKm(from, { lat: store.latitude, lng: store.longitude });
}

/** «850 м · 12 мин пешком» */
export function formatNearDistance(km: number): string {
  const distance = km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} м` : `${km.toFixed(1).replace(".", ",")} км`;
  const minutes = walkMinutesTo(km);
  return minutes <= 60 ? `${distance} · ${minutes} мин пешком` : distance;
}
