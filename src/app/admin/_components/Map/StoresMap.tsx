"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Фикс иконок Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export default function StoresMap({ stores }: { stores: Store[] }) {
  const storesWithCoords = stores.filter(
    (s) => s.latitude !== null && s.longitude !== null
  );

  return (
    <MapContainer
      center={[43.238949, 76.889709]} // Алматы
      zoom={12}
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {storesWithCoords.map((store) => (
        <Marker
          key={store.id}
          position={[store.latitude!, store.longitude!]}
          icon={icon}
        >
          <Popup>
            <strong>{store.name}</strong>
            <br />
            {store.address}
            <br />
            <a href={`/stores/${store.id}`} className="text-rose-600">
              Открыть магазин →
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}