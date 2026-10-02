// Расчёты для маршрута: расстояния по прямой, порядок обхода, ссылки на навигаторы

import type { Dictionary } from "@/lib/i18n/dictionaries";

export type Point = { lat: number; lng: number };

/** Средняя скорость пешком, км/ч */
const WALKING_SPEED_KMH = 4.5;

/** Расстояние между точками по прямой, км (формула гаверсинусов) */
export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Длины отрезков маршрута: legs[i] — от остановки i до i+1 */
export function routeLegs(points: Point[]): number[] {
  return points.slice(1).map((point, i) => distanceKm(points[i], point));
}

export function routeLength(points: Point[]): number {
  return routeLegs(points).reduce((sum, leg) => sum + leg, 0);
}

export function walkingMinutes(km: number): number {
  return Math.round((km / WALKING_SPEED_KMH) * 60);
}

export function formatDistance(km: number, t: Dictionary): string {
  if (km < 1) return t.near.meters(Math.round(km * 1000 / 10) * 10);
  return t.near.kilometers(km.toFixed(1).replace(".", ","));
}

export function formatDuration(minutes: number, t: Dictionary): string {
  if (minutes < 60) return t.tour.minutes(minutes);
  return t.tour.hours(Math.floor(minutes / 60), minutes % 60);
}

/** Ближайший сосед от заданного старта, затем улучшение 2-opt (старт остаётся первым) */
function orderFrom<T extends Point>(start: T, rest: T[]): T[] {
  const order: T[] = [start];
  const left = [...rest];
  while (left.length) {
    const last = order[order.length - 1];
    let best = 0;
    for (let i = 1; i < left.length; i++) {
      if (distanceKm(last, left[i]) < distanceKm(last, left[best])) best = i;
    }
    order.push(left.splice(best, 1)[0]);
  }

  // 2-opt: разворачиваем участки, пока маршрут становится короче
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < order.length - 1; i++) {
      for (let j = i + 1; j < order.length; j++) {
        const candidate = [
          ...order.slice(0, i),
          ...order.slice(i, j + 1).reverse(),
          ...order.slice(j + 1),
        ];
        if (routeLength(candidate) + 1e-9 < routeLength(order)) {
          order.splice(0, order.length, ...candidate);
          improved = true;
        }
      }
    }
  }
  return order;
}

/**
 * Самый короткий порядок обхода: пробуем начать с каждой остановки и берём лучший.
 * Для 10 остановок — мгновенно.
 */
export function optimizeOrder<T extends Point>(stops: T[]): T[] {
  if (stops.length <= 2) return stops;

  let best = stops;
  for (const [i, start] of stops.entries()) {
    const candidate = orderFrom(start, stops.filter((_, j) => j !== i));
    if (routeLength(candidate) + 1e-9 < routeLength(best)) best = candidate;
  }
  return best;
}

const coord = (p: Point) => `${p.lat},${p.lng}`;

/** Google Карты, пешком. Без origin маршрут начинается от местоположения пользователя. */
export function googleMapsRouteUrl(points: Point[]): string {
  const params = new URLSearchParams({
    api: "1",
    destination: coord(points[points.length - 1]),
    travelmode: "walking",
  });
  if (points.length > 1) {
    params.set("waypoints", points.slice(0, -1).map(coord).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Яндекс Карты, пешеходный маршрут через все остановки по порядку */
export function yandexMapsRouteUrl(points: Point[]): string {
  const params = new URLSearchParams({
    rtext: points.map(coord).join("~"),
    rtt: "pd",
  });
  return `https://yandex.ru/maps/?${params.toString()}`;
}
