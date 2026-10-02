-- Польза для магазина: нажатия на WhatsApp, телефон, карту и маршрут, источник визита,
-- и сводка «что дал ShopTour» вместе с бронями.
alter type public.analytics_event_type add value if not exists 'whatsapp_click';
alter type public.analytics_event_type add value if not exists 'phone_click';
alter type public.analytics_event_type add value if not exists 'map_click';
alter type public.analytics_event_type add value if not exists 'tour_add';

-- Откуда пришёл посетитель на страницу магазина или товара:
-- shoptour — нашёл внутри сайта (каталог, поиск, карта, скидки); остальное — пришёл по ссылке извне
alter table public.analytics_events
  add column if not exists source text check (source in ('shoptour', 'direct', 'instagram', 'external'));

-- Сводка для кабинета магазина и админки. SECURITY DEFINER: считает и брони, и события,
-- но только для сотрудников ShopTour и тех, у кого в магазине есть доступ «Статистика».
-- Тип события сравниваем как текст: новые значения enum нельзя использовать в той же транзакции.
create or replace function public.store_value_summary(p_store uuid, p_from timestamptz)
returns table (
  found_visitors bigint,
  own_link_visitors bigint,
  whatsapp_clicks bigint,
  phone_clicks bigint,
  map_clicks bigint,
  tour_adds bigint,
  reservations bigint,
  picked_up bigint,
  picked_up_sum numeric,
  waiting_pickup bigint
)
language sql stable security definer set search_path = public as $$
  select
    (select count(distinct e.visitor_id) from public.analytics_events e
      where e.store_id = p_store and e.created_at >= p_from and e.source = 'shoptour'),
    (select count(distinct e.visitor_id) from public.analytics_events e
      where e.store_id = p_store and e.created_at >= p_from and e.source in ('direct', 'instagram', 'external')),
    (select count(distinct e.visitor_id) from public.analytics_events e
      where e.store_id = p_store and e.created_at >= p_from and e.type::text = 'whatsapp_click'),
    (select count(distinct e.visitor_id) from public.analytics_events e
      where e.store_id = p_store and e.created_at >= p_from and e.type::text = 'phone_click'),
    (select count(distinct e.visitor_id) from public.analytics_events e
      where e.store_id = p_store and e.created_at >= p_from and e.type::text = 'map_click'),
    (select count(distinct e.visitor_id) from public.analytics_events e
      where e.store_id = p_store and e.created_at >= p_from and e.type::text = 'tour_add'),
    (select count(*) from public.reservations r where r.store_id = p_store and r.created_at >= p_from),
    (select count(*) from public.reservations r
      where r.store_id = p_store and r.created_at >= p_from and r.status = 'completed'),
    (select coalesce(sum(r.price), 0) from public.reservations r
      where r.store_id = p_store and r.created_at >= p_from and r.status = 'completed'),
    (select count(*) from public.reservations r
      where r.store_id = p_store and r.created_at >= p_from and r.status = 'confirmed')
  where public.is_staff() or public.has_store_permission(p_store, 'analytics')
$$;

revoke all on function public.store_value_summary(uuid, timestamptz) from public, anon;
grant execute on function public.store_value_summary(uuid, timestamptz) to authenticated;
