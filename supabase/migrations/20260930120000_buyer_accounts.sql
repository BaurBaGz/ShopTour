-- Аккаунты покупателей: избранное, текущий маршрут, недавно просмотренные
-- и сохранённые маршруты — одинаковые на телефоне и компьютере.
-- Без входа всё это по-прежнему хранится только в браузере.

-- Списки id, которые на сайте живут в localStorage (favorites, tour, recent)
create table public.user_lists (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('favorites', 'tour', 'recent')),
  ids text[] not null default '{}' check (cardinality(ids) <= 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

comment on table public.user_lists is 'Избранное, текущий маршрут и недавно просмотренные товары покупателя';

alter table public.user_lists enable row level security;

create policy "user_lists_own" on public.user_lists
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Маршруты, сохранённые под названием
create table public.saved_tours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  store_ids text[] not null check (cardinality(store_ids) between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.saved_tours is 'Сохранённые маршруты покупателя по магазинам';

create index saved_tours_user_idx on public.saved_tours (user_id, created_at desc);

alter table public.saved_tours enable row level security;

create policy "saved_tours_own" on public.saved_tours
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
