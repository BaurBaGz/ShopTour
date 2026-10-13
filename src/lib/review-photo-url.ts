// Фото отзывов лежат в бакете media по пути reviews/<id автора>/<uuid>.webp; в базе — только путь

export const MAX_REVIEW_PHOTOS = 3;

const PATH_RE = /^reviews\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;

export function isReviewPhotoPath(path: string) {
  return PATH_RE.test(path);
}

export function reviewPhotoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}
