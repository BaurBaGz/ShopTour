import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

// Фото отзывов: пересжимаем на сервере и только потом кладём в хранилище.
// sharp не переносит метаданные — геолокация и модель камеры из фото с телефона не сохраняются.

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1280;

export class ReviewPhotoError extends Error {
  constructor(public reason: "type" | "size") {
    super(reason);
  }
}

/** Проверить и пересжать фото; ошибка — если это не картинка или файл слишком большой */
export async function prepareReviewPhoto(file: File): Promise<Buffer> {
  if (!file.type.startsWith("image/")) throw new ReviewPhotoError("type");
  if (file.size > MAX_BYTES) throw new ReviewPhotoError("size");
  try {
    return await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new ReviewPhotoError("type");
  }
}

/** Загрузить уже пересжатые фото; вернуть пути */
export async function uploadReviewPhotos(userId: string, photos: Buffer[]): Promise<string[]> {
  const storage = createAdminClient().storage.from("media");
  const paths: string[] = [];
  for (const photo of photos) {
    const path = `reviews/${userId}/${crypto.randomUUID()}.webp`;
    // Кэш — час, а не год: удалённое фото (автором или модератором) быстро перестаёт открываться
    const { error } = await storage.upload(path, photo, { contentType: "image/webp", cacheControl: "3600", upsert: false });
    if (error) {
      await removeReviewPhotos(paths);
      throw new Error(error.message);
    }
    paths.push(path);
  }
  return paths;
}

export async function removeReviewPhotos(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await createAdminClient().storage.from("media").remove(paths);
  if (error) console.error("[reviews] remove photos:", error.message);
}

/** Удаление аккаунта: все фото его отзывов */
export async function removeUserReviewPhotos(userId: string) {
  const storage = createAdminClient().storage.from("media");
  const { data } = await storage.list(`reviews/${userId}`, { limit: 1000 });
  await removeReviewPhotos((data ?? []).map((file) => `reviews/${userId}/${file.name}`));
}
