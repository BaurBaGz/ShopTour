-- Усиление безопасности: то, что раньше проверял только сайт, теперь проверяет и сама база.
-- Ключ anon публичный, поэтому вошедший пользователь может обращаться к базе напрямую, минуя формы сайта.

-- ---------------------------------------------------------------------------
-- Брони: магазин меняет только статус — имя, телефон и цену покупателя править нельзя
-- (сервер с сервисным ключом по-прежнему пишет всё)
-- ---------------------------------------------------------------------------
revoke insert, update, delete on public.reservations from anon, authenticated;
grant update (status, answered_at) on public.reservations to authenticated;

-- Служебные таблицы: запись только сервером
revoke insert, update, delete on public.store_notifications from anon, authenticated;
revoke insert, update, delete on public.analytics_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Один аккаунт — один магазин (кабинет на это рассчитан)
-- ---------------------------------------------------------------------------
create unique index if not exists stores_owner_unique on public.stores (owner_id) where owner_id is not null;

-- ---------------------------------------------------------------------------
-- Пределы длины и формата — те же, что в формах сайта
-- ---------------------------------------------------------------------------
alter table public.stores
  add constraint stores_text_limits check (
    char_length(name) between 1 and 80
    and char_length(address) <= 200
    and char_length(city) <= 60
    and char_length(coalesce(description, '')) <= 1000
    and char_length(coalesce(phone, '')) <= 30
    and char_length(coalesce(whatsapp, '')) <= 30
    and char_length(coalesce(instagram, '')) <= 100
    and char_length(coalesce(logo_url, '')) <= 500
  ),
  add constraint stores_logo_https check (logo_url is null or logo_url ~ '^https://'),
  add constraint stores_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$');

alter table public.products
  add constraint products_text_limits check (
    char_length(name) between 1 and 120
    and char_length(coalesce(description, '')) <= 2000
    and cardinality(sizes) <= 40
    and cardinality(images) <= 8
    and char_length(array_to_string(images, '')) <= 4000
    and char_length(array_to_string(sizes, '')) <= 800
  );
