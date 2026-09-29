-- Баннеры над каталогом (карусель). Управляются в админке.

create type public.banner_kind as enum ('text', 'steps');
create type public.banner_theme as enum ('rose', 'dark', 'light');

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  -- text — заголовок, текст, кнопка, фото; steps — встроенный «Как это работает»
  kind public.banner_kind not null default 'text',
  title text not null,
  -- Вторая строка заголовка, выделена цветом
  accent text,
  body text,
  cta_label text,
  -- Ссылка кнопки; «#next» — пролистать к следующему баннеру
  cta_href text,
  image_url text,
  theme public.banner_theme not null default 'rose',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.banners is 'Баннеры карусели над каталогом';

alter table public.banners enable row level security;

create policy "banners_select" on public.banners
  for select to anon, authenticated
  using (is_active or public.is_staff());
create policy "banners_insert_staff" on public.banners
  for insert to authenticated with check (public.is_staff());
create policy "banners_update_staff" on public.banners
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "banners_delete_admin" on public.banners
  for delete to authenticated using (public.is_admin());

-- Нынешние два баннера — теперь в базе
insert into public.banners (kind, title, accent, body, cta_label, cta_href, theme, sort_order) values
  ('text', 'Найдите стиль', 'в своём городе',
   'ShopTour собирает одежду из независимых магазинов Алматы в один каталог. Отмечайте понравившееся и стройте маршрут по магазинам, чтобы примерить всё за одну прогулку.',
   'Как это работает', '#next', 'rose', 10),
  ('steps', 'Как это работает', null, 'Примерьте в магазине то, что выбрали онлайн',
   null, null, 'dark', 20);
