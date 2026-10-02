-- Продавцы магазина: входят в кабинет и ведут товары, скидки, акции и брони.
-- Удалять товары, менять профиль магазина и добавлять сотрудников может только владелец.
create table public.store_members (
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  name text check (name is null or char_length(name) <= 60),
  must_change_password boolean not null default false,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id),
  -- один человек работает в одном магазине
  unique (user_id)
);

comment on table public.store_members is 'Продавцы магазинов (доступ в кабинет без прав владельца)';

alter table public.store_members enable row level security;

-- Помощники для правил доступа. SECURITY DEFINER — чтобы правила таблиц не вызывали друг друга по кругу.
create or replace function public.owns_store(p_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = p_store and owner_id = auth.uid())
$$;

create or replace function public.works_in_store(p_store uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = p_store and owner_id = auth.uid())
      or exists (select 1 from public.store_members where store_id = p_store and user_id = auth.uid())
$$;

create policy store_members_select on public.store_members
  for select to authenticated
  using (public.is_staff() or user_id = auth.uid() or public.owns_store(store_id));

create policy store_members_insert on public.store_members
  for insert to authenticated
  with check (public.owns_store(store_id));

create policy store_members_delete on public.store_members
  for delete to authenticated
  using (public.is_staff() or public.owns_store(store_id));

revoke all on public.store_members from anon, authenticated;
grant select, insert, delete on public.store_members to authenticated;

-- Черновик: магазин сам убирает товар с сайта, не удаляя его
alter table public.products add column if not exists is_draft boolean not null default false;
comment on column public.products.is_draft is 'Товар в черновике: виден только магазину (is_hidden — скрыт администрацией)';

-- Товары: читать и менять может и продавец; удалять — по-прежнему только владелец и администратор
alter policy products_select_public on public.products
  using (
    (
      not is_hidden and not is_draft
      and exists (select 1 from public.stores s where s.id = products.store_id and s.status = 'published')
    )
    or public.is_staff()
    or public.works_in_store(store_id)
  );
alter policy products_insert_owner on public.products with check (public.works_in_store(store_id));
alter policy products_update_owner on public.products
  using (public.works_in_store(store_id)) with check (public.works_in_store(store_id));

-- Магазин-черновик виден и его продавцу
alter policy stores_select_public on public.stores
  using (status = 'published' or owner_id = auth.uid() or public.is_staff() or public.works_in_store(id));

alter policy reservations_select on public.reservations
  using (public.is_staff() or user_id = auth.uid() or public.works_in_store(store_id));
alter policy reservations_update_store on public.reservations
  using (public.is_staff() or public.works_in_store(store_id))
  with check (public.is_staff() or public.works_in_store(store_id));

alter policy analytics_select on public.analytics_events
  using (public.is_staff() or public.works_in_store(store_id));

alter policy promotions_select on public.promotions
  using (
    exists (select 1 from public.stores s where s.id = promotions.store_id and s.status = 'published')
    or public.is_staff()
    or public.works_in_store(store_id)
  );
alter policy promotions_insert on public.promotions with check (public.is_staff() or public.works_in_store(store_id));
alter policy promotions_delete on public.promotions using (public.is_staff() or public.works_in_store(store_id));

-- Фото товаров может загружать и продавец; логотип магазина — только владелец
create or replace function public.can_write_store_media(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
    or exists (
      select 1 from public.stores s
      where s.id::text = (storage.foldername(object_name))[2]
        and (
          (s.owner_id = auth.uid() and (storage.foldername(object_name))[1] in ('products', 'stores'))
          or (
            (storage.foldername(object_name))[1] = 'products'
            and exists (select 1 from public.store_members m where m.store_id = s.id and m.user_id = auth.uid())
          )
        )
    )
$$;
