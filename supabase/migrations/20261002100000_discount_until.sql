-- Срок скидки: последний день, когда действует цена со скидкой (по времени Алматы).
-- Пусто — скидка без срока. После этой даты сайт сам возвращает обычную цену.
alter table public.products add column if not exists discount_until date;

comment on column public.products.discount_until is 'Последний день скидки (включительно); null — без срока';
