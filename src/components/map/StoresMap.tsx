"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

// Центр Алматы — если у магазинов нет координат
const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];

// Попап собираем через DOM, чтобы название магазина не выполнялось как HTML
function createPopup(store: Store): HTMLElement {
  const root = document.createElement("div");

  const name = document.createElement("strong");
  name.textContent = store.name;

  const address = document.createElement("div");
  address.textContent = store.address;

  const link = document.createElement("a");
  link.href = `/stores/${store.id}`;
  link.textContent = "Открыть магазин →";
  link.style.color = "#e11d48";

  root.append(name, address, link);
  return root;
}

export default function StoresMap({ stores }: { stores: Store[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView(ALMATY_CENTER, 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });

      const points: [number, number][] = [];
      stores.forEach((store) => {
        if (store.latitude === null || store.longitude === null) return;
        const point: [number, number] = [store.latitude, store.longitude];
        points.push(point);
        L.marker(point, { icon }).addTo(map).bindPopup(createPopup(store));
      });

      if (points.length > 1) {
        map.fitBounds(points, { padding: [40, 40] });
      }

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stores]);

  return (
    <div
      ref={mapRef}
      style={{ height: "400px", width: "100%", borderRadius: "12px" }}
    />
  );
}
