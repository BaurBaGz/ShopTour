-- Статус партнёра и порядок категорий

-- published — виден покупателям; draft — заводится в админке; hidden — временно снят с сайта
create type public.store_status as enum ('draft', 'published', 'hidden');

alter table public.stores
  add column if not exists status public.store_status not null default 'published';

comment on column public.stores.status is 'draft — черновик, published — на сайте, hidden — скрыт';

-- Покупатели видят только опубликованные магазины и их товары.
-- Владелец видит свой магазин в любом статусе, сотрудники — все.
drop policy if exists "stores_select_public" on public.stores;
create policy "stores_select_public" on public.stores
  for select to anon, authenticated
  using (
    status = 'published'
    or owner_id = auth.uid()
    or public.is_staff()
  );

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id
        and (s.status = 'published' or s.owner_id = auth.uid() or public.is_staff())
    )
  );

-- Порядок категорий в фильтрах сайта задаётся в админке
alter table public.categories
  add column if not exists sort_order integer not null default 0;

update public.categories c
set sort_order = ranked.rn * 10
from (select id, row_number() over (order by name) as rn from public.categories) ranked
where ranked.id = c.id and c.sort_order = 0;
