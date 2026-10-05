-- Переводы баннеров и язык Telegram-уведомлений магазина.

-- Баннеры: русский текст остаётся в основных колонках, переводы — в i18n:
-- { "kk": { "title": "...", "accent": "...", "body": "...", "cta_label": "..." }, "en": { ... } }
alter table public.banners add column if not exists i18n jsonb not null default '{}'::jsonb;

update public.banners set i18n = '{
  "kk": {
    "title": "Стиліңізді табыңыз",
    "accent": "өз қалаңызда",
    "body": "ShopTour Алматыдағы тәуелсіз дүкендердің киімін бір каталогқа жинайды. Ұнағанын белгілеп, бәрін бір серуенде киіп көру үшін дүкендер бойынша маршрут құрыңыз.",
    "cta_label": "Бұл қалай жұмыс істейді"
  },
  "en": {
    "title": "Find your style",
    "accent": "in your own city",
    "body": "ShopTour gathers clothes from independent Almaty stores near you into one catalog. Mark what you like and build a route through the stores to try everything on in one walk.",
    "cta_label": "How it works"
  }
}'::jsonb
where kind = 'text' and title = 'Найдите стиль' and i18n = '{}'::jsonb;

update public.banners set i18n = '{
  "kk": { "title": "Бұл қалай жұмыс істейді", "body": "Онлайн таңдағаныңызды дүкенде киіп көріңіз" },
  "en": { "title": "How it works", "body": "Try on in the store what you picked online" }
}'::jsonb
where kind = 'steps' and i18n = '{}'::jsonb;

-- На каком языке бот пишет магазину: язык сайта в момент подключения Telegram
alter table public.store_notifications
  add column if not exists locale text not null default 'ru' check (locale in ('ru', 'kk', 'en'));
