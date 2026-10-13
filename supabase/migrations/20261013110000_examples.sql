-- Товары и отзывы-примеры: показывают магазинам, как выглядит заполненная карточка.
-- На сайте помечены «Пример»; убрать всё разом:
--   delete from public.reviews where is_example; update public.products set is_example = false;

alter table public.products add column if not exists is_example boolean not null default false;

alter table public.reviews add column if not exists is_example boolean not null default false;
-- У примера нет автора-аккаунта
alter table public.reviews alter column user_id drop not null;
alter table public.reviews drop constraint if exists reviews_author;
alter table public.reviews add constraint reviews_author check (user_id is not null or is_example);

-- Сводка теперь знает, сколько отзывов настоящие: если все — примеры, рядом с оценкой пишем «примеры»
drop function if exists public.review_stats(uuid, uuid);
create function public.review_stats(p_store uuid, p_product uuid default null)
returns table (
  store_count integer,
  store_avg numeric,
  store_examples integer,
  product_count integer,
  product_avg numeric,
  product_examples integer,
  fit_small integer,
  fit_true integer,
  fit_large integer
)
language sql stable security definer set search_path = public as $$
  select
    (count(*) filter (where store_rating is not null))::int,
    round(avg(store_rating), 1),
    (count(*) filter (where store_rating is not null and is_example))::int,
    (count(*) filter (where product_rating is not null and product_id = p_product))::int,
    round(avg(product_rating) filter (where product_id = p_product), 1),
    (count(*) filter (where product_rating is not null and product_id = p_product and is_example))::int,
    (count(*) filter (where fit = 'small' and product_id = p_product))::int,
    (count(*) filter (where fit = 'true' and product_id = p_product))::int,
    (count(*) filter (where fit = 'large' and product_id = p_product))::int
  from public.reviews
  where store_id = p_store and status = 'published'
$$;

revoke all on function public.review_stats(uuid, uuid) from public, anon, authenticated;

-- Fus Store — витрина-пример
update public.products set is_example = true
where store_id = (select id from public.stores where slug = 'fus-store');
