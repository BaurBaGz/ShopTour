-- Роли и доступы сотрудников магазина: у каждого — роль (шаблон) и свой набор доступов-галочек.
-- Владелец магазина (stores.owner_id) имеет все доступы всегда.
alter table public.store_members
  add column if not exists role text not null default 'seller'
    check (role in ('admin', 'marketing', 'seller')),
  add column if not exists permissions text[] not null default '{reservations,products,promotions}'
    check (permissions <@ array['reservations', 'products', 'products_delete', 'promotions', 'analytics', 'store', 'staff']);

create or replace function public.has_store_permission(p_store uuid, p_permission text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = p_store and owner_id = auth.uid())
      or exists (
        select 1 from public.store_members
        where store_id = p_store and user_id = auth.uid() and p_permission = any (permissions)
      )
$$;

-- Товары
alter policy products_insert_owner on public.products with check (public.has_store_permission(store_id, 'products'));
alter policy products_update_owner on public.products
  using (public.has_store_permission(store_id, 'products'))
  with check (public.has_store_permission(store_id, 'products'));
alter policy products_delete_owner on public.products using (public.has_store_permission(store_id, 'products_delete'));

-- Брони, статистика, акции
alter policy reservations_select on public.reservations
  using (public.is_staff() or user_id = auth.uid() or public.has_store_permission(store_id, 'reservations'));
alter policy reservations_update_store on public.reservations
  using (public.is_staff() or public.has_store_permission(store_id, 'reservations'))
  with check (public.is_staff() or public.has_store_permission(store_id, 'reservations'));
alter policy analytics_select on public.analytics_events
  using (public.is_staff() or public.has_store_permission(store_id, 'analytics'));
alter policy promotions_insert on public.promotions
  with check (public.is_staff() or public.has_store_permission(store_id, 'promotions'));
alter policy promotions_delete on public.promotions
  using (public.is_staff() or public.has_store_permission(store_id, 'promotions'));

-- Профиль магазина: сотрудник с доступом «Профиль магазина» меняет его, но не владельца
alter policy stores_update_owner on public.stores
  using (public.has_store_permission(id, 'store'))
  with check (public.has_store_permission(id, 'store'));
alter policy store_notifications_select on public.store_notifications
  using (public.is_staff() or public.has_store_permission(store_id, 'store'));

create or replace function public.guard_store_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Сотрудники ShopTour и сервер (сервисный ключ, миграции) меняют владельца свободно
  if public.is_staff() or coalesce(auth.role(), '') = 'service_role' or auth.uid() is null then
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id then
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists stores_guard_owner on public.stores;
create trigger stores_guard_owner before update on public.stores
  for each row execute function public.guard_store_owner();

-- Сотрудники: управляет владелец и тот, у кого доступ «Сотрудники»; себя менять и убирать нельзя
alter policy store_members_select on public.store_members
  using (public.is_staff() or user_id = auth.uid() or public.has_store_permission(store_id, 'staff'));
alter policy store_members_insert on public.store_members
  with check (public.has_store_permission(store_id, 'staff') and user_id <> auth.uid());
alter policy store_members_delete on public.store_members
  using (public.is_staff() or (public.has_store_permission(store_id, 'staff') and user_id <> auth.uid()));

drop policy if exists store_members_update on public.store_members;
create policy store_members_update on public.store_members
  for update to authenticated
  using (public.has_store_permission(store_id, 'staff') and user_id <> auth.uid())
  with check (public.has_store_permission(store_id, 'staff') and user_id <> auth.uid());

grant update (role, permissions, name) on public.store_members to authenticated;

-- Фото: товары — доступ «Товары», логотип — «Профиль магазина»
create or replace function public.can_write_store_media(object_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
    or exists (
      select 1 from public.stores s
      where s.id::text = (storage.foldername(object_name))[2]
        and (
          ((storage.foldername(object_name))[1] = 'products' and public.has_store_permission(s.id, 'products'))
          or ((storage.foldername(object_name))[1] = 'stores' and public.has_store_permission(s.id, 'store'))
        )
    )
$$;
