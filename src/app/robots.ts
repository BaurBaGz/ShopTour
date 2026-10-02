import type { MetadataRoute } from "next";
import { SEARCH_INDEXING_OPEN, SITE_URL } from "@/lib/seo";

// Поисковикам — каталог, витрины и товары; личные и служебные разделы закрыты
export default function robots(): MetadataRoute.Robots {
  // До запуска сайт закрыт от поисковиков целиком (ссылки в мессенджерах при этом работают)
  if (!SEARCH_INDEXING_OPEN) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/account", "/auth", "/api", "/reservations", "/favorites"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
