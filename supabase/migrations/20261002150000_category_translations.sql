-- Названия категорий на казахском и английском. Русское название (name) остаётся основным:
-- если перевода нет, сайт показывает его.
alter table public.categories
  add column if not exists name_kk text check (name_kk is null or char_length(name_kk) between 1 and 60),
  add column if not exists name_en text check (name_en is null or char_length(name_en) between 1 and 60);

update public.categories c set name_kk = v.kk, name_en = v.en
from (values
  ('Аксессуары', 'Аксессуарлар', 'Accessories'),
  ('Брюки', 'Шалбарлар', 'Trousers'),
  ('Верхняя одежда', 'Сырт киім', 'Outerwear'),
  ('Джинсы', 'Джинсы', 'Jeans'),
  ('Костюмы и пиджаки', 'Костюмдер мен пиджактар', 'Suits & blazers'),
  ('Нижнее бельё', 'Іш киім', 'Underwear'),
  ('Обувь', 'Аяқ киім', 'Shoes'),
  ('Платья', 'Көйлектер', 'Dresses'),
  ('Рубашки', 'Жейделер', 'Shirts'),
  ('Спортивная одежда', 'Спорттық киім', 'Sportswear'),
  ('Сумки', 'Сөмкелер', 'Bags'),
  ('Топы и блузки', 'Топтар мен блузкалар', 'Tops & blouses'),
  ('Трикотаж', 'Трикотаж', 'Knitwear'),
  ('Юбки', 'Юбкалар', 'Skirts')
) as v(ru, kk, en)
where c.name = v.ru;
