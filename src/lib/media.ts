"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1600;
const QUALITY = 0.85;

/** Уменьшаем фото с телефона (часто 4000+ px и 5+ МБ) до 1600 px в WebP */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
  if (!blob) throw new Error("Не удалось обработать фото");
  return blob;
}

/**
 * Загрузка фото магазина или товара в хранилище Supabase (бакет media).
 * Путь products/<storeId>/… или stores/<storeId>/… — правила хранилища пускают
 * сотрудников и владельца этого магазина.
 */
export async function uploadStoreImage(
  storeId: string,
  kind: "products" | "stores",
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`«${file.name}» — не изображение`);
  const blob = await compressImage(file);
  const path = `${kind}/${storeId}/${crypto.randomUUID()}.webp`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
