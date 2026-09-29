-- Скрытые товары и хранилище фото

-- is_hidden — товар снят с сайта, но не удалён (массовое «скрыть» в админке)
alter table public.products
  add column if not exists is_hidden boolean not null default false;

comment on column public.products.is_hidden is 'Скрыт с сайта (в админке), не удалён';

-- Покупатели видят товар, только если он не скрыт и магазин опубликован.
-- Владелец видит свои товары в любом состоянии, сотрудники — все.
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.stores s
      where s.id = products.store_id
        and (
          s.owner_id = auth.uid()
          or (s.status = 'published' and not products.is_hidden)
        )
    )
  );

-- Хранилище фото: публичное чтение (фото показываются на сайте),
-- файлы до 5 МБ, только изображения
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Пути: products/<store_id>/<файл>, stores/<store_id>/<файл>.
-- Сотрудники пишут куда угодно, владелец — только в папки своего магазина.
create or replace function public.can_write_store_media(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff()
    or exists (
      select 1 from public.stores s
      where s.owner_id = auth.uid()
        and s.id::text = (storage.foldername(object_name))[2]
        and (storage.foldername(object_name))[1] in ('products', 'stores')
    )
$$;

revoke all on function public.can_write_store_media(text) from public;
grant execute on function public.can_write_store_media(text) to authenticated;

create policy "media_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.can_write_store_media(name));

create policy "media_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.can_write_store_media(name))
  with check (bucket_id = 'media' and public.can_write_store_media(name));

create policy "media_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.can_write_store_media(name));
