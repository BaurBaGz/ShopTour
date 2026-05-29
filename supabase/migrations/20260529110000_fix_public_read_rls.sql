-- Убедиться, что anon и authenticated могут читать каталог
-- (безопасно запускать повторно)

alter table public.categories enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "stores_select_public" on public.stores;
create policy "stores_select_public"
  on public.stores
  for select
  to anon, authenticated
  using (true);

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products
  for select
  to anon, authenticated
  using (true);
