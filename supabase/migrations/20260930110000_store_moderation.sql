-- Модерация магазинов: зарегистрированный самостоятельно магазин попадает в черновики,
-- на сайт его выпускает сотрудник ShopTour. Владелец не может сам менять статус.

alter table public.stores alter column status set default 'draft';

create or replace function public.guard_store_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Сотрудники и сервер (сервисный ключ, миграции) меняют статус свободно
  if public.is_staff() or coalesce(auth.role(), '') = 'service_role' or auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'draft';
  elsif new.status is distinct from old.status then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists stores_guard_status on public.stores;
create trigger stores_guard_status
  before insert or update on public.stores
  for each row execute function public.guard_store_status();
