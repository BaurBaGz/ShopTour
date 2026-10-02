-- Акции магазина («2+1 до 1 ноября»): относятся к магазину целиком, а не к одному товару.
-- ends_on — последний день акции (по времени Алматы); null — без срока.
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text check (description is null or char_length(description) <= 300),
  ends_on date,
  created_at timestamptz not null default now()
);

comment on table public.promotions is 'Акции магазинов для вкладки «Скидки» и витрины';

create index promotions_store_idx on public.promotions (store_id);

alter table public.promotions enable row level security;

-- Видят все — у опубликованных магазинов; владелец и сотрудники — всегда
create policy promotions_select on public.promotions
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.stores s
      where s.id = promotions.store_id and (s.status = 'published' or s.owner_id = auth.uid())
    )
  );

-- Добавляет владелец своего магазина; снять может владелец или сотрудник (модерация)
create policy promotions_insert on public.promotions
  for insert to authenticated
  with check (
    public.is_staff()
    or exists (select 1 from public.stores s where s.id = promotions.store_id and s.owner_id = auth.uid())
  );

create policy promotions_delete on public.promotions
  for delete to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.stores s where s.id = promotions.store_id and s.owner_id = auth.uid())
  );

revoke all on public.promotions from anon, authenticated;
grant select on public.promotions to anon, authenticated;
grant insert, delete on public.promotions to authenticated;
