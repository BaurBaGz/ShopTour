"use client";

import { useT } from "@/lib/i18n/client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useTransition } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { updatePartnerLocationAction } from "@/app/admin/(panel)/partners/actions";

const ALMATY: [number, number] = [43.238949, 76.889709];

type LocationPickerProps = {
  storeId: string;
  latitude: number | null;
  longitude: number | null;
  /** Строка для поиска по адресу: «Алматы, ул. Абая, 44» */
  address: string;
  /** Как сохранить точку. По умолчанию — действие админки; кабинет магазина передаёт своё. */
  onSave?: (latitude: number | null, longitude: number | null) => Promise<{ error?: string | null }>;
};

/** Точка магазина: клик по карте или перетаскивание метки, либо поиск по адресу */
export function LocationPicker({ storeId, latitude, longitude, address, onSave }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  // Поставить метку и показать её крупно — задаётся, когда карта загрузится
  const placeAndFocus = useRef<((p: [number, number]) => void) | null>(null);
  const [point, setPoint] = useState<[number, number] | null>(
    latitude !== null && longitude !== null ? [latitude, longitude] : null,
  );
  const t = useT();
  const c = t.cabinet.location;
  // Подпись метки нужна внутри эффекта карты, который создаётся один раз
  const markerTitle = useRef(c.marker);
  markerTitle.current = c.marker;
  const [saved, setSaved] = useState<[number, number] | null>(point);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      const map = L.map(mapRef.current, { zoomSnap: 0.25 }).setView(point ?? ALMATY, point ? 16 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<div style="width:22px;height:22px;border-radius:9999px;background:#e11d48;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const place = (latlng: [number, number]) => {
        if (marker.current) {
          marker.current.setLatLng(latlng);
        } else {
          marker.current = L.marker(latlng, { icon, draggable: true, keyboard: true, title: markerTitle.current }).addTo(map);
          marker.current.on("dragend", () => {
            const { lat, lng } = marker.current!.getLatLng();
            setPoint([lat, lng]);
          });
        }
      };
      if (point) place(point);
      map.on("click", (e) => {
        const next: [number, number] = [e.latlng.lat, e.latlng.lng];
        place(next);
        setPoint(next);
      });
      mapInstance.current = map;
      placeAndFocus.current = (p) => {
        place(p);
        map.setView(p, 17);
      };
    });
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      marker.current = null;
    };
    // Карта создаётся один раз; дальше точкой управляет пользователь
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findByAddress = async () => {
    setSearching(true);
    setMessage(null);
    try {
      // OpenStreetMap Nominatim: бесплатный поиск адресов, ограничиваем Казахстаном
      const params = new URLSearchParams({ q: address, format: "json", limit: "1", countrycodes: "kz", "accept-language": t.intl.slice(0, 2) });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      const results: { lat: string; lon: string; display_name: string }[] = await response.json();
      if (!results.length) {
        setMessage({ kind: "error", text: c.notFound });
        return;
      }
      const found: [number, number] = [Number(results[0].lat), Number(results[0].lon)];
      placeAndFocus.current?.(found);
      setPoint(found);
      setMessage({ kind: "ok", text: c.found(results[0].display_name) });
    } catch {
      setMessage({ kind: "error", text: c.searchUnavailable });
    } finally {
      setSearching(false);
    }
  };

  const save = (next: [number, number] | null) =>
    startTransition(async () => {
      const lat = next?.[0] ?? null;
      const lng = next?.[1] ?? null;
      const result = onSave ? await onSave(lat, lng) : await updatePartnerLocationAction(storeId, lat, lng);
      if (result.error) {
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setSaved(next);
      if (!next) {
        marker.current?.remove();
        marker.current = null;
        setPoint(null);
      }
      setMessage({ kind: "ok", text: next ? c.saved : c.removed });
    });

  const changed = point?.[0] !== saved?.[0] || point?.[1] !== saved?.[1];

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="loc-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="loc-title" className="text-lg font-semibold text-stone-900">{c.title}</h2>
          <p className="text-sm text-stone-500">{c.hint}</p>
        </div>
        <button
          type="button"
          onClick={findByAddress}
          disabled={searching || !address.trim()}
          className="min-h-11 rounded-xl px-4 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50 disabled:opacity-50"
        >
          {searching ? c.searching : c.findByAddress}
        </button>
      </div>
      <div ref={mapRef} className="mt-4 h-72 w-full overflow-hidden rounded-xl sm:h-80" />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(point)}
          disabled={!point || !changed || pending}
          className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-40"
        >
          {pending ? c.saving : c.save}
        </button>
        {saved && (
          <button
            type="button"
            onClick={() => save(null)}
            disabled={pending}
            className="min-h-11 rounded-xl px-4 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900"
          >
            {c.remove}
          </button>
        )}
        <span className="text-xs tabular-nums text-stone-500">
          {point ? `${point[0].toFixed(5)}, ${point[1].toFixed(5)}` : c.notSet}
          {changed && point && c.unsaved}
        </span>
      </div>
      {message && (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={message.kind === "error" ? "mt-3 text-sm text-red-700" : "mt-3 text-sm text-emerald-800"}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
