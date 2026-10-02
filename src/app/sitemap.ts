import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import type { Database } from "@/types/database";

// Карту сайта пересобираем раз в час — новые магазины и товары попадают в поиск без выкладки сайта
export const revalidate = 3600;

/** Карта сайта для поисковиков: основные страницы, витрины опубликованных магазинов, товары */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/catalog`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sale`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/stores`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/magazinam`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return pages;

  // Публичный ключ без входа: база сама отдаёт только то, что видно всем (RLS)
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
  const [stores, products] = await Promise.all([
    supabase.from("stores").select("slug, created_at").eq("status", "published").limit(5000),
    supabase
      .from("products")
      .select("id, created_at")
      .eq("is_hidden", false)
      .eq("is_draft", false)
      .order("created_at", { ascending: false })
      .limit(20000),
  ]);
  if (stores.error) console.error("[sitemap] stores:", stores.error.message);
  if (products.error) console.error("[sitemap] products:", products.error.message);

  return [
    ...pages,
    ...(stores.data ?? []).map((s) => ({
      url: `${SITE_URL}/s/${s.slug}`,
      lastModified: s.created_at,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(products.data ?? []).map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: p.created_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
