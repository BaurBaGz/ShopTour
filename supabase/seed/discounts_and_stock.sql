-- ShopTour: остатки по размерам и скидки для демо-товаров
-- Требует миграцию 20260929100000_discounts_and_size_stock.sql.
-- Значения псевдослучайные, но стабильные (hashtext), — повторный запуск даёт тот же результат.
-- Товары магазинов с владельцем не затрагиваются (только демо-id f8b1…).

begin;

-- Остатки: примерно каждый 7-й размер закончился, остальные — от 1 до 9 шт.
update public.products p
set size_stock = coalesce(
  (
    select jsonb_object_agg(
      s,
      case
        when abs(hashtext(p.id::text || ':' || s)) % 7 = 0 then 0
        else 1 + abs(hashtext(s || ':' || p.id::text)) % 9
      end
    )
    from unnest(p.sizes) as s
  ),
  '{}'::jsonb
)
where p.id::text like 'f8b1%';

-- У каждого товара хотя бы один размер в наличии
update public.products p
set size_stock = p.size_stock || jsonb_build_object(p.sizes[1], 3)
where p.id::text like 'f8b1%'
  and cardinality(p.sizes) > 0
  and not exists (
    select 1 from jsonb_each_text(p.size_stock) e where e.value::int > 0
  );

-- Скидки 10–30% примерно у четверти товаров; старая цена округлена до 100 ₸
update public.products p
set old_price = null
where p.id::text like 'f8b1%';

update public.products p
set old_price = round(
  p.price / (1 - (array[10, 15, 20, 25, 30])[1 + abs(hashtext(p.id::text || ':pct')) % 5] / 100.0)
  / 100
) * 100
where p.id::text like 'f8b1%'
  and abs(hashtext(p.id::text || ':sale')) % 4 = 0;

commit;

-- Проверка
select
  count(*) filter (where old_price > price) as with_discount,
  count(*) filter (where size_stock <> '{}'::jsonb) as with_stock,
  count(*) as total
from public.products;
