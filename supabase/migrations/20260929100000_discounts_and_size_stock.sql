-- Скидки и остатки по размерам

-- old_price — цена до скидки. Скидка показывается, когда old_price > price
alter table public.products
  add column if not exists old_price numeric(10, 2)
    check (old_price is null or old_price >= 0);

-- size_stock — остаток по размерам: {"S": 3, "M": 0, "L": 5}.
-- Размер без записи — остаток не указан (просто «в наличии»)
alter table public.products
  add column if not exists size_stock jsonb not null default '{}'::jsonb
    check (jsonb_typeof(size_stock) = 'object');

comment on column public.products.old_price is 'Цена до скидки (зачёркнутая). NULL — скидки нет';
comment on column public.products.size_stock is 'Остаток по размерам: {"размер": количество}';
