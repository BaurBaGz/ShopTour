-- Прокат одежды: товар продаётся, сдаётся напрокат или и то и другое
-- (продаётся новая такая же вещь, напрокат — другая). Для проката покупатель записывается на примерку.

alter table public.products
  add column if not exists listing text not null default 'sale' check (listing in ('sale', 'rent', 'both')),
  -- Цена проката за сутки; для listing = 'rent' в price хранится она же (сортировка и фильтр по цене)
  add column if not exists rent_price numeric(10, 2) check (rent_price is null or rent_price >= 0),
  -- Условия на длительный срок, свободным текстом: «3 дня — 15 000 ₸, неделя — 25 000 ₸»
  add column if not exists rent_terms text check (rent_terms is null or char_length(rent_terms) <= 300),
  -- Залог: деньги или документ, свободным текстом; пусто — без залога
  add column if not exists rent_deposit text check (rent_deposit is null or char_length(rent_deposit) <= 100);

alter table public.products
  add constraint products_rent_price_required check (listing = 'sale' or rent_price is not null);

-- Запись на примерку (прокат) рядом с обычной бронью; дата события — когда нужна вещь
alter table public.reservations
  add column if not exists kind text not null default 'reserve' check (kind in ('reserve', 'fitting')),
  add column if not exists event_date date;
