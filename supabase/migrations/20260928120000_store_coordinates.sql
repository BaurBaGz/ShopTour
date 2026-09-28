-- Координаты магазинов для карты (/stores)
-- Колонки уже созданы в базе вручную; миграция фиксирует их в репозитории

alter table public.stores
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.stores.latitude is 'Широта магазина для карты';
comment on column public.stores.longitude is 'Долгота магазина для карты';
