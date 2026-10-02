"use client";
import { useT } from "@/lib/i18n/client";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { dictionaryFor, type Dictionary } from "@/lib/i18n/dictionaries";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { DivIcon, LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import type { MapStore } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils/format";
import { getStoreColor, getStoreInitial } from "@/lib/utils/store-color";

type Leaflet = typeof import("leaflet");

// Центр Алматы — если у магазинов нет координат
const ALMATY_CENTER: [number, number] = [43.238949, 76.889709];
const LOGO_SIZE = 36;
// Длительность плавных перелётов карты, секунды
const FLY_DURATION = 0.8;
const SELECTED_LOGO_SIZE = 46;
const TOUR_COLOR = "#e11d48";

/** Избранный товар для всплывающей карточки над магазином */
export type FavoritePreview = {
  id: string;
  name: string;
  price: number;
  image: string | null;
};

type MarkerExtras = {
  /** Число подходящих товаров (фильтры или избранное) */
  count?: number;
  /** Номер остановки в маршруте */
  tourNumber?: number;
};

type StoresMapProps = {
  stores: MapStore[];
  /** Число — пиксели, строка — любое CSS-значение (например, var(--map-h)) */
  height?: number | string;
  selectedId?: string | null;
  onSelect?: (storeId: string) => void;
  /** Число подходящих товаров на значке магазина (фильтры или избранное) */
  counts?: Record<string, number>;
  /** Избранные товары по магазинам — карточка при наведении */
  favoritesByStore?: Record<string, FavoritePreview[]>;
  /** Остановки маршрута по порядку — номера на значках и линия */
  tourIds?: string[];
};

// Значок-логотип собираем через DOM, чтобы данные магазина не выполнялись как HTML
function createLogoElement(
  store: MapStore,
  size: number,
  selected: boolean,
  { count, tourNumber }: MarkerExtras,
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

  if (tourNumber !== undefined) {
    const stop = document.createElement("span");
    stop.textContent = String(tourNumber);
    Object.assign(stop.style, {
      position: "absolute",
      top: "-6px",
      left: "-7px",
      width: "20px",
      height: "20px",
      borderRadius: "9999px",
      background: "#1c1917",
      color: "#fff",
      fontSize: "11px",
      fontWeight: "700",
      lineHeight: "16px",
      textAlign: "center",
      border: "2px solid #fff",
      boxSizing: "border-box",
    });
    wrapper.append(stop);
  }

  return wrapper;
}

// Карточка при наведении: избранные товары в этом магазине (через DOM — без HTML-вставок)
const TOOLTIP_LIMIT = 3;

// Подписи для элементов, которые карта рисует сама (не через React): обновляются при каждой отрисовке
let mapLabels: Dictionary["map"] = dictionaryFor(DEFAULT_LOCALE).map;

function createFavoritesTooltip(store: MapStore, items: FavoritePreview[]): HTMLElement {
  const root = document.createElement("div");
  Object.assign(root.style, { width: "230px", whiteSpace: "normal" });

  const title = document.createElement("div");
  title.textContent = store.name;
  Object.assign(title.style, { fontWeight: "700", fontSize: "13px", color: "#1c1917" });
  const subtitle = document.createElement("div");
  subtitle.textContent = mapLabels.tooltipFavorites;
  Object.assign(subtitle.style, { fontSize: "11px", color: "#e11d48", marginBottom: "6px" });
  root.append(title, subtitle);

  for (const item of items.slice(0, TOOLTIP_LIMIT)) {
    const row = document.createElement("div");
    Object.assign(row.style, { display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" });

    const thumb = document.createElement("div");
    Object.assign(thumb.style, {
      width: "40px",
      height: "50px",
      flexShrink: "0",
      borderRadius: "8px",
      overflow: "hidden",
      background: "#f5f5f4",
    });
    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = "";
      Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
      thumb.append(img);
    }

    const text = document.createElement("div");
    Object.assign(text.style, { minWidth: "0" });
    const name = document.createElement("div");
    name.textContent = item.name;
    Object.assign(name.style, {
      fontSize: "12px",
      fontWeight: "600",
      color: "#1c1917",
      lineHeight: "1.3",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    const price = document.createElement("div");
    price.textContent = formatPrice(item.price);
    Object.assign(price.style, { fontSize: "12px", color: "#57534e" });
    text.append(name, price);

    row.append(thumb, text);
    root.append(row);
  }

  if (items.length > TOOLTIP_LIMIT) {
    const more = document.createElement("div");
    more.textContent = mapLabels.tooltipMore(items.length - TOOLTIP_LIMIT);
    Object.assign(more.style, { fontSize: "11px", color: "#78716c", marginTop: "6px" });
    root.append(more);
  }

  return root;
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
  extras: MarkerExtras,
): DivIcon {
  const size = selected ? SELECTED_LOGO_SIZE : LOGO_SIZE;
  return L.divIcon({
    html: createLogoElement(store, size, selected, extras),
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
  favoritesByStore,
  tourIds,
}: StoresMapProps) {
  mapLabels = useT().map;
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<Leaflet | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const hasFittedRef = useRef(false);
  const fittedKeyRef = useRef("");
  // Первый выбор, пришедший вместе с картой (из адреса страницы), — с приближением
  // (нет выбора при первом показе — приближать нечего, дальше клики только сдвигают карту)
  const focusedFromUrlRef = useRef(selectedId === null);
  const [ready, setReady] = useState(false);

  // Актуальные значения для обработчиков маркеров, которые создаются реже, чем меняются пропсы
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);
  const countsRef = useRef(counts);
  const tourIdsRef = useRef(tourIds);
  useEffect(() => {
    onSelectRef.current = onSelect;
    countsRef.current = counts;
    tourIdsRef.current = tourIds;
  }, [onSelect, counts, tourIds]);

  const extrasFor = (storeId: string): MarkerExtras => {
    const stop = tourIdsRef.current?.indexOf(storeId) ?? -1;
    return {
      count: countsRef.current?.[storeId],
      tourNumber: stop === -1 ? undefined : stop + 1,
    };
  };

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

      // Кнопка «Показать все магазины» под «+ −»
      const FitControl = L.Control.extend({
        onAdd() {
          const bar = L.DomUtil.create("div", "leaflet-bar");
          const button = L.DomUtil.create("a", "", bar);
          button.href = "#";
          button.setAttribute("role", "button");
          button.title = mapLabels.showAll;
          button.setAttribute("aria-label", mapLabels.showAll);
          Object.assign(button.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          });
          // Статичная иконка «развернуть» — без пользовательских данных
          button.innerHTML =
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
          L.DomEvent.on(button, "click", (event) => {
            L.DomEvent.preventDefault(event);
            L.DomEvent.stopPropagation(event);
            fitAll(true);
          });
          return bar;
        },
      });
      new FitControl({ position: "topleft" }).addTo(map);


      leafletRef.current = L;
      // Линия маршрута — под значками магазинов
      routeLayerRef.current = L.layerGroup().addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setReady(true);

      function fitAll(animate: boolean) {
        const points = [...markersRef.current.values()].map((m) => {
          const { lat, lng } = m.getLatLng();
          return [lat, lng] as [number, number];
        });
        if (points.length > 1) {
          const options = { padding: [40, 40] as [number, number], maxZoom: 15 };
          if (animate) map.flyToBounds(points, { ...options, duration: FLY_DURATION });
          else map.fitBounds(points, options);
        } else if (points.length === 1) {
          if (animate) map.flyTo(points[0], 14, { duration: FLY_DURATION });
          else map.setView(points[0], 14);
        }
      }
    });

    const markers = markersRef.current;
    return () => {
      cancelled = true;
      markers.clear();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
      routeLayerRef.current = null;
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
        icon: makeIcon(L, store, selected, extrasFor(store.id)),
        title: store.name,
        alt: store.name,
        zIndexOffset: selected ? 1000 : 0,
        keyboard: true,
      })
        .on("click", () => {
          // Товары и так откроются под картой, а уменьшенная карта обрезала бы карточку.
          // Leaflet открывает подсказку и на клик (для сенсорных экранов) — закрываем после него.
          requestAnimationFrame(() => marker.closeTooltip());
          onSelectRef.current?.(store.id);
        });

      const favorites = favoritesByStore?.[store.id];
      if (favorites?.length) {
        // У верхнего края карты карточка открывается вниз, иначе её обрежет.
        // Обработчик до bindTooltip: Leaflet вызывает их по порядку, направление успеет смениться.
        marker.on("mouseover", () => {
          const tooltip = marker.getTooltip();
          if (!tooltip) return;
          const size = store.id === selectedIdRef.current ? SELECTED_LOGO_SIZE : LOGO_SIZE;
          // Примерная высота карточки: заголовок + строки товаров
          const shown = Math.min(favorites.length, TOOLTIP_LIMIT);
          const tooltipHeight = 56 + shown * 56 + (favorites.length > shown ? 20 : 0);
          const y = map.latLngToContainerPoint(marker.getLatLng()).y;
          const spaceBelow = map.getSize().y - y;
          const nearTop = y < tooltipHeight + size && spaceBelow > y;
          tooltip.options.direction = nearTop ? "bottom" : "top";
          tooltip.options.offset = nearTop ? [0, size / 2 + 22] : [0, -size / 2 - 4];
        });
        marker.bindTooltip(createFavoritesTooltip(store, favorites), { opacity: 1 });
      }
      layer.addLayer(marker);
      markersRef.current.set(store.id, marker);
    }

    declutterLabels(map.getContainer());

    // Кадр меняем, только если изменился сам набор магазинов (фильтры, режим).
    // Пересборка из-за числа товаров или избранного не должна сдвигать карту.
    const storesKey = stores.map((s) => s.id).join(",");
    if (storesKey === fittedKeyRef.current) return;
    fittedKeyRef.current = storesKey;

    // Первый показ — сразу, дальнейшие изменения (фильтры) — плавным перелётом
    const animate = hasFittedRef.current;
    hasFittedRef.current = true;

    if (points.length > 1) {
      const options = { padding: [40, 40] as [number, number], maxZoom: 15 };
      if (animate) {
        map.flyToBounds(points, { ...options, duration: FLY_DURATION });
      } else {
        // Без анимации: иначе её окончание перебьёт приближение к магазину из ссылки
        map.fitBounds(points, { ...options, animate: false });
      }
    } else if (points.length === 1) {
      if (animate) {
        map.flyTo(points[0], 14, { duration: FLY_DURATION });
      } else {
        map.setView(points[0], 14, { animate: false });
      }
    }
  }, [ready, stores, counts, favoritesByStore]);

  // Маршрут: номера на значках и линия (без перелёта карты)
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!ready || !L || !map || !routeLayer) return;

    for (const store of stores) {
      const marker = markersRef.current.get(store.id);
      if (!marker) continue;
      marker.setIcon(
        makeIcon(L, store, store.id === selectedIdRef.current, extrasFor(store.id)),
      );
    }

    routeLayer.clearLayers();
    const points = (tourIds ?? [])
      .map((id) => stores.find((s) => s.id === id))
      .filter((s): s is MapStore => Boolean(s && s.latitude !== null && s.longitude !== null))
      .map((s) => [s.latitude!, s.longitude!] as [number, number]);
    if (points.length > 1) {
      L.polyline(points, {
        color: TOUR_COLOR,
        weight: 4,
        opacity: 0.8,
        dashArray: "8 8",
        interactive: false,
      }).addTo(routeLayer);
    }
    declutterLabels(map.getContainer());
  }, [ready, stores, tourIds, favoritesByStore, counts]);

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
      marker.setIcon(makeIcon(L, store, selected, extrasFor(id)));
      marker.setZIndexOffset(selected ? 1000 : 0);
      declutterLabels(mapInstanceRef.current!.getContainer());
      if (selected && !focusedFromUrlRef.current) {
        // Магазин выбран ещё до показа карты (ссылка «Показать на карте») — сразу крупно
        focusedFromUrlRef.current = true;
        const map = mapInstanceRef.current!;
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: false });
      } else if (selected) {
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
        height: typeof height === "number" ? `${height}px` : height,
        position: "relative",
        width: "100%",
        borderRadius: "12px",
        transition: "height 300ms ease",
      }}
    />
  );
}
