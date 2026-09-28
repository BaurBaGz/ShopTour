"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { DivIcon, LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import type { MapStore } from "@/lib/data/catalog";
import { getStoreColor, getStoreInitial } from "@/lib/utils/store-color";

type Leaflet = typeof import("leaflet");

// Центр Алматы — если у магазинов нет координат
const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];
const LOGO_SIZE = 36;
// Длительность плавных перелётов карты, секунды
const FLY_DURATION = 0.8;
const SELECTED_LOGO_SIZE = 46;


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

  circle.dataset.logo = "";

  if (store.logo_url) {
    const img = document.createElement("img");
    img.src = store.logo_url;
    img.alt = store.name;
    Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
    circle.append(img);
  } else {
    circle.textContent = getStoreInitial(store.name);
    Object.assign(circle.style, {
      background: getStoreColor(store.id),
      color: "#fff",
      fontWeight: "700",
      fontSize: `${Math.round(size * 0.4)}px`,
    });
  }
  wrapper.append(circle);

  // Подпись под логотипом; при наложениях скрывается (см. declutterLabels)
  const label = document.createElement("span");
  label.className = "store-map-label";
  if (selected) label.dataset.selected = "";
  label.textContent = store.name;
  Object.assign(label.style, {
    position: "absolute",
    top: `${size + 3}px`,
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "130px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "1px 7px",
    borderRadius: "9999px",
    background: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
    color: selected ? "#e11d48" : "#1c1917",
    fontSize: "11px",
    fontWeight: selected ? "700" : "600",
    lineHeight: "16px",
    cursor: "pointer",
  });
  wrapper.append(label);

  if (count !== undefined) {
    const badge = document.createElement("span");
    badge.textContent = String(count);
    Object.assign(badge.style, {
      position: "absolute",
      top: "-6px",
      right: "-7px",
      minWidth: "19px",
      height: "19px",
      padding: "0 5px",
      borderRadius: "9999px",
      background: "#e11d48",
      color: "#fff",
      fontSize: "11px",
      fontWeight: "700",
      lineHeight: "15px",
      textAlign: "center",
      border: "2px solid #fff",
      boxSizing: "border-box",
    });
    wrapper.append(badge);
  }

  return wrapper;
}

type Rect = { left: number; top: number; right: number; bottom: number };

const overlaps = (a: Rect, b: Rect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// Прячем подписи, которые наезжают на другие подписи или чужие логотипы.
// Выбранный магазин — первым и всегда виден; остальные — по порядку, пока есть место.
function declutterLabels(container: HTMLElement) {
  const labels = Array.from(
    container.querySelectorAll<HTMLElement>(".store-map-label"),
  ).sort((a, b) => Number("selected" in b.dataset) - Number("selected" in a.dataset));

  const logos = Array.from(container.querySelectorAll<HTMLElement>("[data-logo]"));
  const logoRects = logos.map((logo) => ({ logo, rect: logo.getBoundingClientRect() }));
  const taken: Rect[] = [];

  for (const label of labels) {
    label.style.visibility = "visible";
    const rect = label.getBoundingClientRect();
    const ownLogo = label.parentElement?.querySelector("[data-logo]");
    const blocked =
      !("selected" in label.dataset) &&
      (taken.some((r) => overlaps(r, rect)) ||
        logoRects.some(({ logo, rect: r }) => logo !== ownLogo && overlaps(r, rect)));

    if (blocked) {
      label.style.visibility = "hidden";
    } else {
      taken.push(rect);
    }
  }
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

      const container = mapRef.current;
      map.on("zoomend", () => declutterLabels(container));

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
        .on("click", () => onSelectRef.current?.(store.id));
      layer.addLayer(marker);
      markersRef.current.set(store.id, marker);
    }

    // Первый показ — сразу, дальнейшие изменения (фильтры) — плавным перелётом
    const animate = hasFittedRef.current;
    hasFittedRef.current = true;
    declutterLabels(map.getContainer());

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
      declutterLabels(mapInstanceRef.current!.getContainer());
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
