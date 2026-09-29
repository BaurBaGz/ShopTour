-- Сотрудники админки и их роли.
-- admin — всё, включая удаление и управление сотрудниками;
-- moderator — редактирует магазины, товары, категории, но ничего не удаляет.

create type public.staff_role as enum ('admin', 'moderator');

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.staff_role not null,
  email text not null,
  name text,
  -- Сотрудник, созданный с временным паролем, обязан сменить его при первом входе
  must_change_password boolean not null default false,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.staff is 'Сотрудники админки ShopTour';

-- Роль текущего пользователя. security definer — чтобы политики на staff
-- могли спрашивать роль, не упираясь в RLS самой таблицы (без рекурсии).
create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.staff where user_id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid())
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'admin')
$$;

revoke all on function public.current_staff_role() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_staff_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- staff: видят сотрудники, меняют только администраторы
alter table public.staff enable row level security;

create policy "staff_select_staff" on public.staff
  for select to authenticated using (public.is_staff());

create policy "staff_insert_admin" on public.staff
  for insert to authenticated with check (public.is_admin());

create policy "staff_update_admin" on public.staff
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Сменить себе флаг must_change_password может и сам сотрудник (после смены пароля)
create policy "staff_update_self" on public.staff
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = public.current_staff_role());

create policy "staff_delete_admin" on public.staff
  for delete to authenticated using (public.is_admin());

-- Магазины, товары, категории: сотрудники создают и правят любые, удаляет только админ.
-- Политики владельцев магазинов остаются — разрешающие политики складываются (OR).
create policy "stores_insert_staff" on public.stores
  for insert to authenticated with check (public.is_staff());
create policy "stores_update_staff" on public.stores
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "stores_delete_admin" on public.stores
  for delete to authenticated using (public.is_admin());

create policy "products_insert_staff" on public.products
  for insert to authenticated with check (public.is_staff());
create policy "products_update_staff" on public.products
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "products_delete_admin" on public.products
  for delete to authenticated using (public.is_admin());

create policy "categories_insert_staff" on public.categories
  for insert to authenticated with check (public.is_staff());
create policy "categories_update_staff" on public.categories
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "categories_delete_admin" on public.categories
  for delete to authenticated using (public.is_admin());
