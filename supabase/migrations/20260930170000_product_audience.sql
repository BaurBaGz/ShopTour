-- Для кого товар: разделы каталога «Женщинам / Мужчинам / Детям (девочкам / мальчикам)».
-- Унисекс показывается и женщинам, и мужчинам; детское унисекс — и девочкам, и мальчикам.
create type public.product_audience as enum ('women', 'men', 'unisex', 'girls', 'boys', 'kids');

alter table public.products
  add column if not exists audience public.product_audience not null default 'unisex';

comment on column public.products.audience is 'Для кого: women, men, unisex, girls, boys, kids (детское унисекс)';

create index if not exists products_audience_idx on public.products (audience);
