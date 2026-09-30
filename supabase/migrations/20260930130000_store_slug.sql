-- Короткий адрес витрины магазина: shoptour.kz/s/<slug> — для шапки Instagram

-- Латиница из названия: кириллица (русская и казахская) транслитерируется, остальное — дефисы
create or replace function public.make_store_slug(store_name text)
returns text
language plpgsql
immutable
as $$
declare
  src text := lower(coalesce(store_name, ''));
  out text := '';
  ch text;
  map jsonb := '{"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya","ә":"a","ғ":"g","қ":"k","ң":"n","ө":"o","ұ":"u","ү":"u","һ":"h","і":"i"}';
begin
  foreach ch in array regexp_split_to_array(src, '') loop
    out := out || coalesce(map ->> ch, ch);
  end loop;
  out := regexp_replace(out, '[^a-z0-9]+', '-', 'g');
  -- Обрезаем до 40 символов так, чтобы адрес не кончался дефисом
  return trim(both '-' from left(trim(both '-' from out), 40));
end;
$$;

alter table public.stores add column if not exists slug text;

-- Существующим магазинам — адрес из названия; совпадения получают номер
do $$
declare
  s record;
  base text;
  candidate text;
  n int;
begin
  for s in select id, name from public.stores where slug is null order by created_at loop
    base := public.make_store_slug(s.name);
    if length(base) < 3 then base := 'store-' || left(s.id::text, 6); end if;
    candidate := base;
    n := 2;
    while exists (select 1 from public.stores where slug = candidate) loop
      candidate := trim(both '-' from left(base, 36)) || '-' || n;
      n := n + 1;
    end loop;
    update public.stores set slug = candidate where id = s.id;
  end loop;
end;
$$;

alter table public.stores
  add constraint stores_slug_format check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$');
create unique index if not exists stores_slug_key on public.stores (slug);

comment on column public.stores.slug is 'Короткий адрес витрины: /s/<slug>';

-- Новый магазин получает адрес автоматически (владелец может сменить в кабинете)
create or replace function public.set_store_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base text;
  candidate text;
  n int := 2;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  base := public.make_store_slug(new.name);
  if length(base) < 3 then base := 'store-' || left(new.id::text, 6); end if;
  candidate := base;
  while exists (select 1 from public.stores where slug = candidate and id <> new.id) loop
    candidate := trim(both '-' from left(base, 36)) || '-' || n;
    n := n + 1;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists stores_set_slug on public.stores;
create trigger stores_set_slug
  before insert on public.stores
  for each row execute function public.set_store_slug();
