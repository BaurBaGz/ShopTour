import type { NextConfig } from "next";

// Заголовки безопасности для всех страниц
const securityHeaders = [
  // Сайт нельзя встроить во фрейм на чужой странице (защита от подмены кликов)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Браузер не угадывает тип файла сам
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Чужим сайтам не уходит полный адрес страницы (в нём бывает id брони)
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Геолокация нужна для «Рядом»; камера и микрофон — нет
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Фото — только по https (ссылки с http не принимаем и при сохранении товара)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
