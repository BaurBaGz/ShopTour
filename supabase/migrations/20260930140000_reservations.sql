-- Бронь размера: покупатель просит отложить вещь, магазин отвечает (в Telegram или в кабинете)

create type public.reservation_status as enum (
  'new',        -- ждёт ответа магазина
  'confirmed',  -- магазин отложил
  'declined',   -- нет в наличии
  'completed',  -- покупатель забрал
  'no_show'     -- не пришёл
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- Копия на момент брони: товар могут переименовать или удалить
  product_name text not null,
  size text,
  price integer not null,
  customer_name text not null check (char_length(customer_name) between 1 and 60),
  customer_phone text not null check (customer_phone ~ '^7\d{10}$'),
  visit text not null check (visit in ('today', 'tomorrow')),
  comment text check (char_length(comment) <= 300),
  user_id uuid references auth.users (id) on delete set null,
  status public.reservation_status not null default 'new',
  telegram_message_id bigint,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

comment on table public.reservations is 'Брони размеров: покупатель придёт примерить и купить';

create index reservations_store_idx on public.reservations (store_id, created_at desc);
create index reservations_user_idx on public.reservations (user_id, created_at desc) where user_id is not null;
create index reservations_phone_idx on public.reservations (customer_phone, created_at desc);

alter table public.reservations enable row level security;

-- Видят: владелец магазина, сотрудники, сам покупатель (если бронировал из аккаунта).
-- Создаёт бронь только сервер (проверки и защита от спама), отвечает владелец или сотрудник.
create policy "reservations_select" on public.reservations
  for select to authenticated
  using (
    public.is_staff()
    or user_id = auth.uid()
    or exists (select 1 from public.stores s where s.id = reservations.store_id and s.owner_id = auth.uid())
  );

create policy "reservations_update_store" on public.reservations
  for update to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.stores s where s.id = reservations.store_id and s.owner_id = auth.uid())
  )
  with check (
    public.is_staff()
    or exists (select 1 from public.stores s where s.id = reservations.store_id and s.owner_id = auth.uid())
  );

-- Куда слать уведомления магазину. Отдельно от stores: карточки магазинов видны всем,
-- а код привязки и чат — нет.
create table public.store_notifications (
  store_id uuid primary key references public.stores (id) on delete cascade,
  telegram_chat_id bigint,
  telegram_name text,
  linked_at timestamptz,
  link_code text unique,
  link_code_expires_at timestamptz
);

comment on table public.store_notifications is 'Telegram-чат магазина для броней и сводок';

alter table public.store_notifications enable row level security;

create policy "store_notifications_select" on public.store_notifications
  for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.stores s where s.id = store_notifications.store_id and s.owner_id = auth.uid())
  );
-- Пишет только сервер (сервисный ключ): код привязки, чат из бота
