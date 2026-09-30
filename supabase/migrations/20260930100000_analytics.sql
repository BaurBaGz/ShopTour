-- Аналитика: анонимные события посетителей сайта.
-- Пишет только сервер (/api/track, сервисный ключ) — после проверки, что это не робот
-- и не сотрудник. Читают сотрудники (всё) и владельцы магазинов (события своего магазина).

create type public.analytics_event_type as enum (
  'page_view',     -- открыта страница сайта
  'product_view',  -- открыта карточка товара
  'store_view',    -- открыта страница магазина
  'favorite_add',  -- товар добавлен в избранное
  'search',        -- поиск в каталоге (query, results)
  'banner_view',   -- баннер показан в карусели
  'banner_click'   -- нажата кнопка баннера
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type public.analytics_event_type not null,
  -- Случайный id из браузера посетителя, без личных данных
  visitor_id text not null,
  path text,
  product_id uuid references public.products (id) on delete set null,
  store_id uuid references public.stores (id) on delete cascade,
  banner_id uuid references public.banners (id) on delete set null,
  query text,
  results integer
);

comment on table public.analytics_events is 'Анонимные события посетителей для раздела «Аналитика»';

create index analytics_events_created_idx on public.analytics_events (created_at);
create index analytics_events_type_created_idx on public.analytics_events (type, created_at);
create index analytics_events_store_created_idx on public.analytics_events (store_id, created_at)
  where store_id is not null;

alter table public.analytics_events enable row level security;

create policy "analytics_select" on public.analytics_events
  for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.stores s
      where s.id = analytics_events.store_id and s.owner_id = auth.uid()
    )
  );
-- Ни вставки, ни правки для anon/authenticated: пишет только сервер

-- Сводки считает база (security invoker — действует RLS выше).
-- p_store — только события одного магазина (кабинет партнёра).

-- Сводка по дням, в часовом поясе Алматы
create or replace function public.analytics_daily(p_from timestamptz, p_store uuid default null)
returns table (
  day date,
  visitors bigint,
  page_views bigint,
  product_views bigint,
  store_views bigint,
  favorites bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (e.created_at at time zone 'Asia/Almaty')::date as day,
    count(distinct e.visitor_id),
    count(*) filter (where e.type = 'page_view'),
    count(*) filter (where e.type = 'product_view'),
    count(*) filter (where e.type = 'store_view'),
    count(*) filter (where e.type = 'favorite_add')
  from public.analytics_events e
  where e.created_at >= p_from
    and (p_store is null or e.store_id = p_store)
  group by 1
  order by 1
$$;

-- Уникальные посетители за весь период (сумма по дням считала бы человека несколько раз)
create or replace function public.analytics_visitors(p_from timestamptz, p_store uuid default null)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select count(distinct e.visitor_id)
  from public.analytics_events e
  where e.created_at >= p_from
    and (p_store is null or e.store_id = p_store)
$$;

create or replace function public.analytics_top_products(
  p_from timestamptz,
  p_store uuid default null,
  p_limit integer default 10
)
returns table (product_id uuid, views bigint, visitors bigint, favorites bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.product_id,
    count(*) filter (where e.type = 'product_view'),
    count(distinct e.visitor_id) filter (where e.type = 'product_view'),
    count(*) filter (where e.type = 'favorite_add')
  from public.analytics_events e
  where e.created_at >= p_from
    and e.product_id is not null
    and e.type in ('product_view', 'favorite_add')
    and (p_store is null or e.store_id = p_store)
  group by e.product_id
  order by 2 desc, 4 desc
  limit p_limit
$$;

create or replace function public.analytics_top_stores(p_from timestamptz, p_limit integer default 10)
returns table (store_id uuid, store_views bigint, product_views bigint, favorites bigint, visitors bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.store_id,
    count(*) filter (where e.type = 'store_view'),
    count(*) filter (where e.type = 'product_view'),
    count(*) filter (where e.type = 'favorite_add'),
    count(distinct e.visitor_id)
  from public.analytics_events e
  where e.created_at >= p_from
    and e.store_id is not null
    and e.type in ('store_view', 'product_view', 'favorite_add')
  group by e.store_id
  order by count(*) filter (where e.type in ('store_view', 'product_view')) desc
  limit p_limit
$$;

-- Популярные запросы; zero — сколько раз запрос ничего не нашёл
create or replace function public.analytics_searches(p_from timestamptz, p_limit integer default 15)
returns table (query text, searches bigint, visitors bigint, zero bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.query,
    count(*),
    count(distinct e.visitor_id),
    count(*) filter (where e.results = 0)
  from public.analytics_events e
  where e.created_at >= p_from
    and e.type = 'search'
    and e.query is not null
  group by e.query
  order by 2 desc, 1
  limit p_limit
$$;

create or replace function public.analytics_banners(p_from timestamptz)
returns table (banner_id uuid, views bigint, clicks bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    e.banner_id,
    count(*) filter (where e.type = 'banner_view'),
    count(*) filter (where e.type = 'banner_click')
  from public.analytics_events e
  where e.created_at >= p_from
    and e.banner_id is not null
    and e.type in ('banner_view', 'banner_click')
  group by e.banner_id
$$;

revoke all on function public.analytics_daily(timestamptz, uuid) from public, anon;
revoke all on function public.analytics_visitors(timestamptz, uuid) from public, anon;
revoke all on function public.analytics_top_products(timestamptz, uuid, integer) from public, anon;
revoke all on function public.analytics_top_stores(timestamptz, integer) from public, anon;
revoke all on function public.analytics_searches(timestamptz, integer) from public, anon;
revoke all on function public.analytics_banners(timestamptz) from public, anon;
grant execute on function public.analytics_daily(timestamptz, uuid) to authenticated;
grant execute on function public.analytics_visitors(timestamptz, uuid) to authenticated;
grant execute on function public.analytics_top_products(timestamptz, uuid, integer) to authenticated;
grant execute on function public.analytics_top_stores(timestamptz, integer) to authenticated;
grant execute on function public.analytics_searches(timestamptz, integer) to authenticated;
grant execute on function public.analytics_banners(timestamptz) to authenticated;
