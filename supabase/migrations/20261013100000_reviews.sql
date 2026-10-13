-- Отзывы покупателей: в карточке товара — о товаре и о магазине.
-- Оставить может любой вошедший пользователь; «Бронировал(а) через ShopTour» — пометка,
-- если у автора была бронь в этом магазине. Магазин отвечает публично и может пожаловаться,
-- скрывает отзыв только команда ShopTour.
-- Читает и пишет только сервер (сервисный ключ) после своих проверок — прямого доступа из браузера нет.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  -- Товар удалили — отзыв о магазине остаётся
  product_id uuid references public.products (id) on delete set null,
  product_name text,
  -- Аккаунт удалили — его отзывы тоже удаляются
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  -- Как сходил: купил / примерил, но не купил / был в магазине / не был (просто смотрел на сайте)
  outcome text check (outcome in ('bought', 'tried', 'visited', 'online')),
  store_rating smallint check (store_rating between 1 and 5),
  product_rating smallint check (product_rating between 1 and 5),
  fit text check (fit in ('small', 'true', 'large')),
  body text check (body is null or char_length(body) <= 1000),
  verified boolean not null default false,
  status text not null default 'published' check (status in ('published', 'hidden')),
  reported_at timestamptz,
  report_reason text check (report_reason is null or char_length(report_reason) <= 300),
  store_reply text check (store_reply is null or char_length(store_reply) <= 500),
  store_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_has_rating check (store_rating is not null or product_rating is not null)
);

comment on table public.reviews is 'Отзывы покупателей о товарах и магазинах';

-- Один отзыв на товар от одного человека (повторно — редактирует свой)
create unique index reviews_user_product_key on public.reviews (user_id, product_id) where product_id is not null;
create index reviews_store_idx on public.reviews (store_id, created_at desc);
create index reviews_product_idx on public.reviews (product_id, created_at desc) where product_id is not null;
create index reviews_reported_idx on public.reviews (reported_at) where reported_at is not null;

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;

-- Сводка для карточки: средние оценки и «как сидит»
create or replace function public.review_stats(p_store uuid, p_product uuid default null)
returns table (
  store_count integer,
  store_avg numeric,
  product_count integer,
  product_avg numeric,
  fit_small integer,
  fit_true integer,
  fit_large integer
)
language sql stable security definer set search_path = public as $$
  select
    (count(*) filter (where store_rating is not null))::int,
    round(avg(store_rating), 1),
    (count(*) filter (where product_rating is not null and product_id = p_product))::int,
    round(avg(product_rating) filter (where product_id = p_product), 1),
    (count(*) filter (where fit = 'small' and product_id = p_product))::int,
    (count(*) filter (where fit = 'true' and product_id = p_product))::int,
    (count(*) filter (where fit = 'large' and product_id = p_product))::int
  from public.reviews
  where store_id = p_store and status = 'published'
$$;

-- Насколько магазину можно доверять: как быстро отвечает на брони и как часто откладывает вещь (за 90 дней)
create or replace function public.store_trust(p_store uuid)
returns table (answered integer, kept integer, median_minutes integer)
language sql stable security definer set search_path = public as $$
  select
    count(*)::int,
    (count(*) filter (where status in ('confirmed', 'completed', 'no_show')))::int,
    (percentile_cont(0.5) within group (order by extract(epoch from (answered_at - created_at)) / 60))::int
  from public.reservations
  where store_id = p_store
    and answered_at is not null
    and created_at > now() - interval '90 days'
$$;

-- Интерес к товару за 7 дней: брони и разные посетители, открывшие карточку
create or replace function public.product_popularity(p_product uuid)
returns table (reservations integer, viewers integer)
language sql stable security definer set search_path = public as $$
  select
    (select count(*)::int from public.reservations
      where product_id = p_product and created_at > now() - interval '7 days'),
    (select count(distinct visitor_id)::int from public.analytics_events
      where product_id = p_product and type = 'product_view' and created_at > now() - interval '7 days')
$$;

create index if not exists analytics_events_product_created_idx
  on public.analytics_events (product_id, created_at) where product_id is not null;
create index if not exists reservations_product_created_idx
  on public.reservations (product_id, created_at) where product_id is not null;

revoke all on function public.review_stats(uuid, uuid) from public, anon, authenticated;
revoke all on function public.store_trust(uuid) from public, anon, authenticated;
revoke all on function public.product_popularity(uuid) from public, anon, authenticated;

-- Новый доступ сотрудников «Отзывы»: администраторам и маркетингу — сразу
update public.store_members
set permissions = array_append(permissions, 'reviews')
where role in ('admin', 'marketing') and not ('reviews' = any (permissions));
