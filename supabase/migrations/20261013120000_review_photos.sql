-- Фото к отзыву: до 3 штук. Хранятся в бакете media по пути reviews/<id автора>/<uuid>.webp,
-- загружает только сервер (после пересжатия и удаления данных EXIF, в том числе геолокации).
alter table public.reviews add column if not exists photos text[] not null default '{}';
alter table public.reviews drop constraint if exists reviews_photos_max;
alter table public.reviews add constraint reviews_photos_max check (cardinality(photos) <= 3);
