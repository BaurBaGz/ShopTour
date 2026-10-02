import type { Metadata } from "next";

export const SITE_URL = "https://www.shoptour.kz";
export const SITE_NAME = "ShopTour";
/**
 * Пускать ли поисковики. Пока в каталоге демо-магазины — нет: иначе в поиск попадут магазины,
 * которых не существует. Поставить true после чистки демо-каталога, перед запуском.
 */
export const SEARCH_INDEXING_OPEN = false;
/** Картинка по умолчанию для превью ссылок в мессенджерах и соцсетях (1200×630) */
export const DEFAULT_OG_IMAGE = "/og-default.jpg";

/**
 * Заголовок, описание и карточка-превью страницы: как ссылка выглядит в WhatsApp, Telegram, Instagram.
 * path — постоянный адрес страницы (без него — общие значения для страниц без своего описания);
 * image — картинка 1200×630 (по умолчанию логотип).
 */
export function pageMeta(options: { title: string; description: string; path?: string; image?: string }): Metadata {
  const { title, description, path, image = DEFAULT_OG_IMAGE } = options;
  // В карточке название сайта показывается отдельно — убираем его из заголовка
  const cardTitle = title.replace(/\s+—\s+ShopTour$/, "");
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ru_RU",
      ...(path ? { url: path } : {}),
      title: cardTitle,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: cardTitle, description, images: [image] },
  };
}
