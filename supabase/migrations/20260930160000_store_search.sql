-- Поиск магазинов по названию — в том числе примерному: опечатки и другая раскладка
-- («фус стор» → Fus Store). Сравниваем латинские адреса витрин (slug), куда
-- названия уже переведены транслитерацией, по похожести триграмм.

create extension if not exists pg_trgm with schema extensions;

create or replace function public.search_stores(q text, max_results integer default 5)
returns table (id uuid, name text, slug text, address text, city text, logo_url text, latitude double precision, longitude double precision)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with term as (
    select lower(trim(q)) as raw, public.make_store_slug(q) as latin
  )
  select s.id, s.name, s.slug, s.address, s.city, s.logo_url, s.latitude, s.longitude
  from public.stores s, term t
  where s.status = 'published'
    and length(t.raw) >= 3
    and (
      lower(s.name) like '%' || t.raw || '%'
      or (length(t.latin) >= 2 and s.slug like '%' || t.latin || '%')
      or (length(t.latin) >= 3 and extensions.word_similarity(t.latin, s.slug) >= 0.5)
      or extensions.similarity(lower(s.name), t.raw) >= 0.35
    )
  order by greatest(
    extensions.similarity(lower(s.name), t.raw),
    extensions.word_similarity(t.latin, s.slug),
    case when lower(s.name) like t.raw || '%' then 1 else 0 end
  ) desc
  limit max_results
$$;

grant execute on function public.search_stores(text, integer) to anon, authenticated;
