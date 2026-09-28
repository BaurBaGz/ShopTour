"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { DivIcon, LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import type { MapStore } from "@/lib/data/catalog";

type Leaflet = typeof import("leaflet");

// Центр Алматы — если у магазинов нет координат
const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];
const LOGO_SIZE = 44;
// Длительность плавных перелётов карты, секунды
const FLY_DURATION = 0.8;
const SELECTED_LOGO_SIZE = 56;

type StoresMapProps = {
  stores: MapStore[];
  height?: number;
  selectedId?: string | null;
  onSelect?: (storeId: string) => void;
  /** Число подходящих товаров на значке магазина (когда включены фильтры) */
  counts?: Record<string, number>;
};

// Значок-логотип собираем через DOM, чтобы данные магазина не выполнялись как HTML
function createLogoElement(
  store: MapStore,
  size: number,
  selected: boolean,
  count: number | undefined,
): HTMLElement {
  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    position: "relative",
    width: `${size}px`,
    height: `${size}px`,
  });

  const circle = document.createElement("div");
  Object.assign(circle.style, {
    width: "100%",
    height: "100%",
    borderRadius: "9999px",
    overflow: "hidden",
    background: "#fff",
    border: `3px solid ${selected ? "#e11d48" : "#fff"}`,
    boxShadow: selected
      ? "0 6px 16px rgba(225, 29, 72, 0.45)"
      : "0 3px 10px rgba(0, 0, 0, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxSizing: "border-box",
  });

  if (store.logo_url) {
    const img = document.createElement("img");
    img.src = store.logo_url;
    img.alt = store.name;
    Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
    circle.append(img);
  } else {
    circle.textContent = store.name.charAt(0).toUpperCase();
    Object.assign(circle.style, {
      background: "#1c1917",
      color: "#fff",
      fontWeight: "700",
      fontSize: `${Math.round(size * 0.4)}px`,
    });
  }
  wrapper.append(circle);

  if (count !== undefined) {
    const badge = document.createElement("span");
    badge.textContent = String(count);
    Object.assign(badge.style, {
      position: "absolute",
      top: "-6px",
      right: "-6px",
      minWidth: "22px",
      height: "22px",
      padding: "0 6px",
      borderRadius: "9999px",
      background: "#e11d48",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "700",
      lineHeight: "18px",
      textAlign: "center",
      border: "2px solid #fff",
      boxSizing: "border-box",
    });
    wrapper.append(badge);
  }

  return wrapper;
}

function makeIcon(
  L: Leaflet,
  store: MapStore,
  selected: boolean,
  count: number | undefined,
): DivIcon {
  const size = selected ? SELECTED_LOGO_SIZE : LOGO_SIZE;
  return L.divIcon({
    html: createLogoElement(store, size, selected, count),
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -size / 2],
  });
}

export default function StoresMap({
  stores,
  height = 400,
  selectedId = null,
  onSelect,
  counts,
}: StoresMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<Leaflet | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const hasFittedRef = useRef(false);
  const [ready, setReady] = useState(false);

  // Актуальные значения для обработчиков маркеров, которые создаются реже, чем меняются пропсы
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  const countsRef = useRef(counts);
  useEffect(() => {
    onSelectRef.current = onSelect;
    countsRef.current = counts;
  }, [onSelect, counts]);

  // Карта создаётся один раз
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        // Плавный зум колесом и трекпадом: шаг 0.25 уровня, в 2 раза больше прокрутки на уровень
        zoomSnap: 0.25,
        wheelPxPerZoomLevel: 120,
        wheelDebounceTime: 60,
      }).setView(ALMATY_CENTER, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      leafletRef.current = L;
      layerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setReady(true);
    });

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      markers.clear();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Маркеры пересобираются при смене списка магазинов (например, после фильтров)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;

    layer.clearLayers();
    markersRef.current.clear();

    const points: [number, number][] = [];
    for (const store of stores) {
      if (store.latitude === null || store.longitude === null) continue;
      const point: [number, number] = [store.latitude, store.longitude];
      points.push(point);

      const selected = store.id === selectedIdRef.current;
      const marker = L.marker(point, {
        icon: makeIcon(L, store, selected, countsRef.current?.[store.id]),
        title: store.name,
        alt: store.name,
        zIndexOffset: selected ? 1000 : 0,
        keyboard: true,
      })
        .bindTooltip(store.name, { direction: "top" })
        .on("click", () => onSelectRef.current?.(store.id));
      layer.addLayer(marker);
      markersRef.current.set(store.id, marker);
    }

    // Первый показ — сразу, дальнейшие изменения (фильтры) — плавным перелётом
    const animate = hasFittedRef.current;
    hasFittedRef.current = true;
    if (points.length > 1) {
      const options = { padding: [40, 40] as [number, number], maxZoom: 15 };
      if (animate) {
        map.flyToBounds(points, { ...options, duration: FLY_DURATION });
      } else {
        map.fitBounds(points, options);
      }
    } else if (points.length === 1) {
      if (animate) {
        map.flyTo(points[0], 14, { duration: FLY_DURATION });
      } else {
        map.setView(points[0], 14);
      }
    }
  }, [ready, stores, counts]);

  // Подсветка выбранного магазина и центрирование на нём
  useEffect(() => {
    const previousId = selectedIdRef.current;
    selectedIdRef.current = selectedId;
    const L = leafletRef.current;
    if (!ready || !L) return;

    for (const id of new Set([previousId, selectedId])) {
      if (!id) continue;
      const marker = markersRef.current.get(id);
      const store = stores.find((s) => s.id === id);
      if (!marker || !store) continue;
      const selected = id === selectedId;
      marker.setIcon(makeIcon(L, store, selected, countsRef.current?.[id]));
      marker.setZIndexOffset(selected ? 1000 : 0);
      if (selected) {
        mapInstanceRef.current?.panTo(marker.getLatLng(), {
          animate: true,
          duration: 0.5,
          easeLinearity: 0.2,
        });
      }
    }
  }, [ready, selectedId, stores]);

  // После изменения высоты Leaflet должен пересчитать размер и держать выбранный магазин в центре
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.invalidateSize();
      const marker = selectedIdRef.current
        ? markersRef.current.get(selectedIdRef.current)
        : null;
      // Во время анимации высоты срабатывает много раз — без своей анимации, чтобы не дёргалось
      if (marker) map.panTo(marker.getLatLng(), { animate: false });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        height: `${height}px`,
        width: "100%",
        borderRadius: "12px",
        transition: "height 300ms ease",
      }}
    />
  );
}
