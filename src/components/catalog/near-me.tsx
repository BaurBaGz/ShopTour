"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { DEFAULT_WALK, formatNear, parseWalk, WALK_OPTIONS } from "@/lib/near";
import { cn } from "@/lib/utils/cn";
import type { Point } from "@/lib/utils/route";

// Последнее выбранное место — чтобы не спрашивать каждый раз и показывать расстояние на странице товара
const NEAR_KEY = "shoptour:near";
type SavedPlace = Point & { place?: string };

export function readSavedPlace(): SavedPlace | null {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(NEAR_KEY) ?? "null");
    return parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number" ? parsed : null;
  } catch {
    return null;
  }
}

const placeListeners = new Set<() => void>();
let placeCache: { raw: string | null; value: SavedPlace | null } = { raw: null, value: null };

function savePlace(place: SavedPlace) {
  try {
    window.localStorage.setItem(NEAR_KEY, JSON.stringify(place));
  } catch {
    // без хранилища — только до перезагрузки
  }
  placeListeners.forEach((l) => l());
}

/** Сохранённое место покупателя (на сервере — null) */
export function useSavedPlace(): SavedPlace | null {
  return useSyncExternalStore(
    (l) => {
      placeListeners.add(l);
      return () => placeListeners.delete(l);
    },
    () => {
      let raw: string | null = null;
      try {
        raw = window.localStorage.getItem(NEAR_KEY);
      } catch {
        raw = null;
      }
      if (raw !== placeCache.raw) placeCache = { raw, value: readSavedPlace() };
      return placeCache.value;
    },
    () => null,
  );
}

type SearchResult = { lat: number; lng: number; label: string; detail: string };

/** Короткая подпись адреса: «проспект Абая, 10» */
function shortLabel(item: { display_name: string; address?: Record<string, string> }): string {
  const a = item.address ?? {};
  const street = a.road ?? a.pedestrian ?? a.neighbourhood ?? a.suburb;
  if (street) return a.house_number ? `${street}, ${a.house_number}` : street;
  return item.display_name.split(",").slice(0, 2).join(",").trim();
}

const chipButton =
  "min-h-11 rounded-xl px-3 text-sm font-medium ring-1 transition sm:min-h-9";

/** Кнопка «Рядом» в строке фильтров каталога */
export function NearMeButton({ active, open, onClick }: { active: boolean; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="near-panel"
      className={cn(
        "flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition sm:px-4",
        active ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
      )}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
      Рядом
    </button>
  );
}

/** Панель «Рядом со мной»: где покупатель и сколько он готов идти пешком */
export function NearMePanel({
  active,
  walk,
  place,
  onClose,
}: {
  active: boolean;
  walk?: string;
  place?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saved = useSavedPlace();
  const [editingPlace, setEditingPlace] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "locating" | "searching" | "error"; text?: string }>({ kind: "idle" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentWalk = parseWalk(walk);

  const go = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const applyPlace = (point: SavedPlace) => {
    savePlace(point);
    setEditingPlace(false);
    setResults(null);
    setStatus({ kind: "idle" });
    go({ near: formatNear(point), place: point.place ?? null, walk: String(currentWalk ?? DEFAULT_WALK) });
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setStatus({ kind: "error", text: "Браузер не умеет определять местоположение. Введите адрес." });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => applyPlace({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        setStatus({
          kind: "error",
          text:
            err.code === err.PERMISSION_DENIED
              ? "Нет доступа к местоположению. Разрешите его в настройках браузера или введите адрес."
              : "Не получилось определить местоположение. Введите адрес.",
        }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  };

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;
    setStatus({ kind: "searching" });
    // OpenStreetMap Nominatim: бесплатный поиск адресов; ищем в Алматы, если город не указан
    const q = /алмат|almat/i.test(text) ? text : `${text}, Алматы`;
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "5",
      countrycodes: "kz",
      addressdetails: "1",
      "accept-language": "ru",
    });
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      const data: { lat: string; lon: string; display_name: string; address?: Record<string, string> }[] = await response.json();
      // OpenStreetMap иногда ставит первым похожий номер дома на другой улице —
      // поднимаем адреса, где есть слова из запроса («Абая 44» → проспект Абая, 44)
      const words = text.toLowerCase().match(/[a-zа-яё]{3,}/g) ?? [];
      const score = (label: string) => words.filter((w) => label.toLowerCase().includes(w)).length;
      const found = data.map((item) => ({
        lat: Number(item.lat),
        lng: Number(item.lon),
        label: shortLabel(item),
        detail: item.display_name.split(",").slice(2, 4).join(",").trim(),
      }));
      setResults(found.map((r, i) => ({ r, i, s: score(r.label) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.r));
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error", text: "Поиск адреса сейчас недоступен. Попробуйте определить местоположение." });
    }
  };

  const choosing = !active || editingPlace;

  return (
        <div id="near-panel" className="rounded-2xl border border-stone-200/80 bg-white p-4 sm:p-5" aria-busy={isPending}>
          {choosing ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-semibold text-stone-900">Где вы?</p>
                <p className="text-sm text-stone-500">Покажем вещи в магазинах рядом — ближе всего сверху.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={locate}
                  disabled={status.kind === "locating"}
                  className="min-h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                >
                  {status.kind === "locating" ? "Определяем…" : "📍 Определить моё местоположение"}
                </button>
                {saved && (
                  <button
                    type="button"
                    onClick={() => applyPlace(saved)}
                    className={cn(chipButton, "text-stone-700 ring-stone-200 hover:bg-stone-50")}
                  >
                    {saved.place ? `Как в прошлый раз: ${saved.place}` : "Как в прошлый раз"}
                  </button>
                )}
              </div>
              <form onSubmit={search} className="flex gap-2">
                <label htmlFor="near-address" className="sr-only">
                  Адрес
                </label>
                <input
                  id="near-address"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="или адрес: Абая 10, Тимирязева 42…"
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none placeholder:text-stone-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
                />
                <button
                  type="submit"
                  disabled={status.kind === "searching"}
                  className="min-h-11 shrink-0 rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:opacity-60"
                >
                  {status.kind === "searching" ? "Ищем…" : "Найти"}
                </button>
              </form>
              {results && (
                <ul className="flex flex-col gap-1">
                  {results.length === 0 && <li className="text-sm text-stone-500">Адрес не найден. Попробуйте иначе: улица и номер дома.</li>}
                  {results.map((r, i) => (
                    <li key={`${r.lat},${r.lng},${i}`}>
                      <button
                        type="button"
                        onClick={() => applyPlace({ lat: r.lat, lng: r.lng, place: r.label })}
                        className="flex min-h-11 w-full flex-col items-start justify-center rounded-xl px-3 py-2 text-left transition hover:bg-stone-50"
                      >
                        <span className="text-sm font-medium text-stone-900">{r.label}</span>
                        {r.detail && <span className="text-xs text-stone-500">{r.detail}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {status.kind === "error" && (
                <p role="alert" className="text-sm text-amber-800">
                  {status.text}
                </p>
              )}
              {active && (
                <button type="button" onClick={() => setEditingPlace(false)} className="self-start text-sm font-medium text-stone-500 hover:text-stone-900">
                  Отмена
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-stone-600">
                {place ? <>Рядом с адресом <span className="font-medium text-stone-900">{place}</span></> : "Рядом с вами"}
                {" · "}
                <button type="button" onClick={() => setEditingPlace(true)} className="font-medium text-rose-600 hover:text-rose-700">
                  изменить
                </button>
              </p>
              <div>
                <p className="mb-2 text-xs font-medium text-stone-500">Сколько идти пешком</p>
                <div className="flex flex-wrap gap-2">
                  {WALK_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => go({ walk: String(minutes) })}
                      aria-pressed={currentWalk === minutes}
                      className={cn(
                        chipButton,
                        currentWalk === minutes ? "bg-stone-900 text-white ring-stone-900" : "text-stone-700 ring-stone-200 hover:bg-stone-50",
                      )}
                    >
                      до {minutes} мин
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => go({ walk: null })}
                    aria-pressed={currentWalk === null}
                    className={cn(
                      chipButton,
                      currentWalk === null ? "bg-stone-900 text-white ring-stone-900" : "text-stone-700 ring-stone-200 hover:bg-stone-50",
                    )}
                  >
                    Любое расстояние
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  go({ near: null, walk: null, place: null });
                }}
                className="self-start text-sm font-medium text-stone-500 hover:text-stone-900"
              >
                Выключить «Рядом»
              </button>
            </div>
          )}
        </div>
  );
}
