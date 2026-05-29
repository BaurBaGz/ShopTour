  -- Владельцы магазинов + WhatsApp + RLS для личного кабинета
  -- Выполните в Supabase → SQL Editor

  alter table public.stores
    add column if not exists owner_id uuid references auth.users (id) on delete set null;

  alter table public.stores
    add column if not exists whatsapp text;

  comment on column public.stores.owner_id is 'Пользователь Supabase Auth — владелец магазина';
  comment on column public.stores.whatsapp is 'Номер WhatsApp (если отличается от phone)';

  create index if not exists stores_owner_id_idx on public.stores (owner_id);

  -- Удаляем слишком широкие политики записи
  drop policy if exists "stores_insert_authenticated" on public.stores;
  drop policy if exists "stores_update_authenticated" on public.stores;
  drop policy if exists "stores_delete_authenticated" on public.stores;
  drop policy if exists "products_insert_authenticated" on public.products;
  drop policy if exists "products_update_authenticated" on public.products;
  drop policy if exists "products_delete_authenticated" on public.products;

  -- Магазин: создать может только себе (owner_id = текущий пользователь)
  create policy "stores_insert_owner"
    on public.stores
    for insert
    to authenticated
    with check (owner_id = auth.uid());

  -- Магазин: менять только свой
  create policy "stores_update_owner"
    on public.stores
    for update
    to authenticated
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

  create policy "stores_delete_owner"
    on public.stores
    for delete
    to authenticated
    using (owner_id = auth.uid());

  -- Товары: добавлять только в свой магазин
  create policy "products_insert_owner"
    on public.products
    for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.stores
        where stores.id = products.store_id
          and stores.owner_id = auth.uid()
      )
    );

  create policy "products_update_owner"
    on public.products
    for update
    to authenticated
    using (
      exists (
        select 1
        from public.stores
        where stores.id = products.store_id
          and stores.owner_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.stores
        where stores.id = products.store_id
          and stores.owner_id = auth.uid()
      )
    );

  create policy "products_delete_owner"
    on public.products
    for delete
    to authenticated
    using (
      exists (
        select 1
        from public.stores
        where stores.id = products.store_id
          and stores.owner_id = auth.uid()
      )
    );
