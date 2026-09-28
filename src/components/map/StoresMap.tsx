"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { DivIcon, Map as LeafletMap, Marker } from "leaflet";
import type { MapStore } from "@/lib/data/catalog";

// Центр Алматы — если у магазинов нет координат
const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];
const LOGO_SIZE = 44;
const SELECTED_LOGO_SIZE = 56;

type StoresMapProps = {
  stores: MapStore[];
  height?: number;
  selectedId?: string | null;
  onSelect?: (storeId: string) => void;
};

// Значок-логотип собираем через DOM, чтобы данные магазина не выполнялись как HTML
function createLogoElement(store: MapStore, size: number, selected: boolean): HTMLElement {
  const root = document.createElement("div");
  Object.assign(root.style, {
    width: `${size}px`,
    height: `${size}px`,
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
    transition: "border-color 150ms, box-shadow 150ms",
  });

  if (store.logo_url) {
    const img = document.createElement("img");
    img.src = store.logo_url;
    img.alt = store.name;
    Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
    root.append(img);
  } else {
    root.textContent = store.name.charAt(0).toUpperCase();
    Object.assign(root.style, {
      background: "#1c1917",
      color: "#fff",
      fontWeight: "700",
      fontSize: `${Math.round(size * 0.4)}px`,
    });
  }

  return root;
}

export default function StoresMap({
  stores,
  height = 400,
  selectedId = null,
  onSelect,
}: StoresMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const makeIconRef = useRef<((store: MapStore, selected: boolean) => DivIcon) | null>(null);
  // Последний onSelect — маркеры создаются один раз и не должны держать старый колбэк
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;
    const markers = markersRef.current;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(ALMATY_CENTER, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const makeIcon = (store: MapStore, selected: boolean) => {
        const size = selected ? SELECTED_LOGO_SIZE : LOGO_SIZE;
        return L.divIcon({
          html: createLogoElement(store, size, selected),
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          tooltipAnchor: [0, -size / 2],
        });
      };
      makeIconRef.current = makeIcon;

      const points: [number, number][] = [];
      stores.forEach((store) => {
        if (store.latitude === null || store.longitude === null) return;
        const point: [number, number] = [store.latitude, store.longitude];
        points.push(point);

        const selected = store.id === selectedIdRef.current;
        const marker = L.marker(point, {
          icon: makeIcon(store, selected),
          title: store.name,
          alt: store.name,
          zIndexOffset: selected ? 1000 : 0,
          keyboard: true,
        })
          .addTo(map)
          .bindTooltip(store.name, { direction: "top" })
          .on("click", () => onSelectRef.current?.(store.id));
        markers.set(store.id, marker);
      });

      if (points.length > 1) {
        map.fitBounds(points, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      markers.clear();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stores]);

  // Подсветка выбранного магазина и центрирование на нём
  useEffect(() => {
    const previousId = selectedIdRef.current;
    selectedIdRef.current = selectedId;
    const makeIcon = makeIconRef.current;
    if (!makeIcon) return;

    for (const id of [previousId, selectedId]) {
      if (!id) continue;
      const marker = markersRef.current.get(id);
      const store = stores.find((s) => s.id === id);
      if (!marker || !store) continue;
      const selected = id === selectedId;
      marker.setIcon(makeIcon(store, selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
      if (selected) {
        mapInstanceRef.current?.panTo(marker.getLatLng());
      }
    }
  }, [selectedId, stores]);

  // После изменения высоты Leaflet должен пересчитать размер и держать выбранный магазин в центре
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const handleResize = () => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.invalidateSize();
      const marker = selectedIdRef.current
        ? markersRef.current.get(selectedIdRef.current)
        : null;
      if (marker) {
        map.panTo(marker.getLatLng());
      }
    };

    const observer = new ResizeObserver(handleResize);
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
