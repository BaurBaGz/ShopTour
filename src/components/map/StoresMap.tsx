"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export default function StoresMap({ stores }: { stores: Store[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = L.map(mapRef.current!).setView([43.238949, 76.889709], 12);

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

      stores
        .filter((s) => s.latitude && s.longitude)
        .forEach((store) => {
          L.marker([store.latitude!, store.longitude!], { icon })
            .addTo(map)
            .bindPopup(`<b>${store.name}</b><br/>${store.address}`);
        });

      mapInstanceRef.current = map;
    });

    return () => {
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