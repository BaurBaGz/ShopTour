// Цвет фона для логотипа-буквы: один и тот же магазин всегда получает один цвет
const STORE_COLORS = [
  "#e11d48", // rose
  "#ea580c", // orange
  "#ca8a04", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0284c7", // sky
  "#4f46e5", // indigo
  "#9333ea", // purple
  "#c026d3", // fuchsia
  "#57534e", // stone
];

export function getStoreColor(storeId: string): string {
  let hash = 0;
  for (const char of storeId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return STORE_COLORS[hash % STORE_COLORS.length];
}

export function getStoreInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
