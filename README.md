# ShopTour

Маркетплейс одежды для локальных магазинов города.

## Стек

- **Next.js** — сайт и API
- **Supabase** — база данных, авторизация, хранение фото
- **Tailwind CSS** — стили

## Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. Скопируйте **Project URL** и **anon key** в `.env.local` (см. `.env.example`).
3. В **SQL Editor** по очереди выполните миграции из `supabase/migrations/`.
4. (Опционально) Тестовые данные: `supabase/seed/demo_almaty_stores.sql`.
5. **Authentication → Providers → Email**: для разработки можно отключить «Confirm email».

## Запуск

```bash
cp .env.example .env.local
# заполните ключи Supabase

npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Структура

```
src/
  app/              # страницы (App Router)
  components/       # UI, каталог, карточки магазинов
  hooks/            # React-хуки
  lib/              # Supabase-клиенты, утилиты
  types/            # TypeScript-типы БД
supabase/
  migrations/       # SQL-миграции
```
