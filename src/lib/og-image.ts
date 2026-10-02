import sharp from "sharp";

// Картинки для превью ссылок. Фото магазинов хранятся в WebP, а мессенджеры надёжно показывают
// только JPEG/PNG — поэтому превью отдаём своим адресом: 1200×630, JPEG.

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_BYTES = 10 * 1024 * 1024;

function jpeg(body: Buffer, maxAge: number) {
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=604800`,
    },
  });
}

/** Нет фото — отправляем к общей картинке с логотипом (она лежит рядом с сайтом как обычный файл) */
function fallback(origin: string) {
  return Response.redirect(new URL("/og-default.jpg", origin), 302);
}

/** Превью из фото товара или магазина; если фото нет или оно не открылось — логотип ShopTour */
export async function ogImageResponse(request: Request, sourceUrl: string | null | undefined): Promise<Response> {
  const origin = new URL(request.url).origin;
  const fallbackResponse = () => fallback(origin);
  if (!sourceUrl || !/^https:\/\//.test(sourceUrl)) return fallbackResponse();
  try {
    const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok || !(response.headers.get("content-type") ?? "").startsWith("image/")) return fallbackResponse();
    const input = Buffer.from(await response.arrayBuffer());
    if (input.byteLength > MAX_BYTES) return fallbackResponse();
    // Фото вещей вертикальные, а карточка широкая. Обрезка оставила бы от платья одну середину,
    // поэтому фото ставим целиком по центру, а по бокам — оно же, размытое.
    const [background, photo] = await Promise.all([
      sharp(input).rotate().resize(WIDTH, HEIGHT, { fit: "cover" }).blur(40).modulate({ brightness: 0.85 }).toBuffer(),
      sharp(input).rotate().resize(WIDTH, HEIGHT, { fit: "inside" }).toBuffer(),
    ]);
    const output = await sharp(background)
      .composite([{ input: photo, gravity: "centre" }])
      .jpeg({ quality: 82 })
      .toBuffer();
    return jpeg(output, 86400);
  } catch (error) {
    console.error("[og-image]", (error as Error).message);
    return fallbackResponse();
  }
}
