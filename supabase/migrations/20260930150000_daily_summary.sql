-- Ежедневная сводка магазину в Telegram: можно отключить в кабинете
alter table public.store_notifications
  add column if not exists daily_summary boolean not null default true,
  add column if not exists last_summary_at timestamptz;

comment on column public.store_notifications.daily_summary is 'Присылать утреннюю сводку за вчера';
comment on column public.store_notifications.last_summary_at is 'Когда отправили последнюю сводку (защита от двойной отправки)';
