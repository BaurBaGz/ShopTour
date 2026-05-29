-- ShopTour: начальная схема БД
-- Запустите этот файл в Supabase → SQL Editor → Run

-- ---------------------------------------------------------------------------
-- Расширения
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- categories — справочник категорий одежды
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Справочник категорий товаров';

-- ---------------------------------------------------------------------------
-- stores — магазины города
-- ---------------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text not null,
  city text not null,
  phone text,
  instagram text,
  logo_url text,
  created_at timestamptz not null default now()
);

comment on table public.stores is 'Локальные магазины одежды';

create index stores_city_idx on public.stores (city);

-- ---------------------------------------------------------------------------
-- products — товары магазина
-- category_id → categories (вместо дублирования названия в каждой строке)
-- sizes, images — массивы (например {"S","M","L"} и URL фото)
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  category_id uuid not null references public.categories (id),
  sizes text[] not null default '{}',
  images text[] not null default '{}',
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.products is 'Товары, привязанные к магазину';

create index products_store_id_idx on public.products (store_id);
create index products_category_id_idx on public.products (category_id);
create index products_in_stock_idx on public.products (in_stock) where in_stock = true;

-- ---------------------------------------------------------------------------
-- Начальные категории
-- ---------------------------------------------------------------------------
insert into public.categories (name) values
  ('Верхняя одежда'),
  ('Платья'),
  ('Юбки'),
  ('Брюки'),
  ('Джинсы'),
  ('Обувь'),
  ('Сумки'),
  ('Аксессуары'),
  ('Спортивная одежда'),
  ('Нижнее бельё')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security (кто что может читать/менять)
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;

-- Все могут смотреть каталог (гости и покупатели)
create policy "categories_select_public"
  on public.categories
  for select
  to anon, authenticated
  using (true);

create policy "stores_select_public"
  on public.stores
  for select
  to anon, authenticated
  using (true);

create policy "products_select_public"
  on public.products
  for select
  to anon, authenticated
  using (true);

-- Пока только вошедшие пользователи могут добавлять/менять (позже привяжем к владельцу магазина)
create policy "stores_insert_authenticated"
  on public.stores
  for insert
  to authenticated
  with check (true);

create policy "stores_update_authenticated"
  on public.stores
  for update
  to authenticated
  using (true)
  with check (true);

create policy "stores_delete_authenticated"
  on public.stores
  for delete
  to authenticated
  using (true);

create policy "products_insert_authenticated"
  on public.products
  for insert
  to authenticated
  with check (true);

create policy "products_update_authenticated"
  on public.products
  for update
  to authenticated
  using (true)
  with check (true);

create policy "products_delete_authenticated"
  on public.products
  for delete
  to authenticated
  using (true);

-- Категории меняет только сервисная роль / админ (через SQL или dashboard)
-- Обычные пользователи только читают справочник
