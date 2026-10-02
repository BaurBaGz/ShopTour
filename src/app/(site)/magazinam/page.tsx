import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = pageMeta({
  title: "ShopTour для магазинов — покупатели рядом с вами",
  description:
    "Бесплатная витрина для магазина одежды: покупатели рядом видят ваши вещи, откладывают размер и приходят примерить. Брони — в Telegram.",
  path: "/magazinam",
});

const BENEFITS = [
  {
    icon: "📍",
    title: "Вас находят те, кто рядом",
    text: "Покупатель открывает «Рядом со мной» и видит вещи в магазинах в 15 минутах пешком. Ваш магазин — на карте и в маршрутах.",
  },
  {
    icon: "🛍",
    title: "Брони приходят в Telegram",
    text: "Покупатель просит отложить размер — вам приходит сообщение. Отвечаете одной кнопкой: «Отложили» или «Нет в наличии».",
  },
  {
    icon: "🔗",
    title: "Витрина вместо Taplink",
    text: "Ссылка shoptour.kz/s/ваш-магазин для шапки Instagram: все вещи, размеры в наличии, адрес на карте и кнопка WhatsApp.",
  },
  {
    icon: "📱",
    title: "Всё с телефона",
    text: "Сфотографировали вещь — она на сайте за минуту. Продали — нажали «−» у размера. Никаких таблиц и компьютера.",
  },
  {
    icon: "📊",
    title: "Видно, что работает",
    text: "Каждое утро в Telegram: сколько людей смотрели ваш магазин вчера, что добавили в избранное, сколько броней.",
  },
  {
    icon: "💬",
    title: "Покупатели сами пишут вам",
    text: "Кнопка WhatsApp на каждом товаре — с готовым сообщением: какая вещь и какой размер нужен.",
  },
];

const STEPS = [
  { title: "Зарегистрируйте магазин", text: "Email, пароль, название и адрес. Подтвердите почту по ссылке из письма." },
  { title: "Добавьте товары", text: "Хотя бы 5–10 вещей с фото, ценой и размерами. С телефона это пара минут на вещь." },
  { title: "Поставьте точку на карте", text: "В «Профиле магазина» — по адресу или пальцем на карте. Без неё вас нет в «Рядом»." },
  { title: "Подключите Telegram", text: "Кнопка в кабинете → «Start» в боте. Брони и утренняя сводка будут приходить туда." },
  { title: "Поставьте ссылку в Instagram", text: "Скопируйте адрес витрины в кабинете и добавьте в шапку профиля." },
];

const FAQ = [
  {
    q: "Сколько это стоит?",
    a: "Сейчас подключение бесплатное. Никаких комиссий с продаж — покупатель платит вам в магазине, как обычно.",
  },
  {
    q: "Кто добавляет товары?",
    a: "Вы — из кабинета с телефона. На старте можем помочь завести первые товары вместе.",
  },
  {
    q: "А если вещь уже продали?",
    a: "Нажмите «−» у размера или «Снять с продажи» — на сайте она сразу пропадёт из наличия. Если бронь пришла на проданную вещь, ответьте «Нет в наличии».",
  },
  {
    q: "Как покупатель платит?",
    a: "В вашем магазине, после примерки. ShopTour не принимает деньги и не доставляет — только приводит людей к вам.",
  },
  {
    q: "Когда магазин появится на сайте?",
    a: "После короткой проверки командой ShopTour — обычно в течение дня. Пока идёт проверка, можно спокойно заполнить товары.",
  },
  {
    q: "Нужен ли свой сайт или Kaspi?",
    a: "Нет. ShopTour — отдельная витрина. Если у вас уже есть Instagram или Kaspi, одно другому не мешает.",
  },
];

// Памятка для владельцев магазинов: открыть с телефона при встрече, отправить ссылкой или распечатать
export default function ForStoresPage() {
  return (
    <main className="print:text-[12px]">
      <section className="relative overflow-hidden bg-stone-900 text-white print:bg-white print:text-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,29,72,0.35),transparent_55%)] print:hidden" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 print:py-6">
          <p className="text-sm font-medium text-rose-300 print:text-rose-700">ShopTour для магазинов</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Покупатели рядом увидят ваши вещи до того, как придут
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-300 print:text-stone-600">
            ShopTour собирает одежду из магазинов Алматы в один каталог и на карту. Человек находит вещь рядом с домом,
            откладывает размер и приходит примерить — к вам.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
            <Link
              href="/auth/register"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-6 text-base font-semibold text-white transition hover:bg-rose-500"
            >
              Подключить магазин бесплатно
            </Link>
            <Link
              href="/auth/login?next=/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-6 text-base font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              Я уже с вами — войти
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone-400 print:text-stone-600">Бесплатно · без комиссии с продаж · всё с телефона</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 print:py-4" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold tracking-tight text-stone-900">
          Как это выглядит для покупателя
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Находит", "В каталоге или через «Рядом со мной» — вещи в магазинах поблизости, с ценой и размерами в наличии."],
            ["Откладывает", "Нажимает «Отложить размер» — вам приходит бронь в Telegram, вы подтверждаете одной кнопкой."],
            ["Приходит к вам", "Примеряет и покупает в магазине. Или строит маршрут по нескольким магазинам на прогулку."],
          ].map(([title, text], i) => (
            <li key={title} className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">{i + 1}</span>
              <p className="mt-3 font-semibold text-stone-900">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-12 print:py-4" aria-labelledby="benefits-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="benefits-title" className="text-2xl font-semibold tracking-tight text-stone-900">
            Что получает магазин
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-stone-200 p-5 print:break-inside-avoid">
                <p className="text-2xl" aria-hidden>
                  {b.icon}
                </p>
                <p className="mt-2 font-semibold text-stone-900">{b.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 print:break-before-page print:py-4" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-2xl font-semibold tracking-tight text-stone-900">
          Подключение за 15 минут
        </h2>
        <ol className="mt-6 flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 print:break-inside-avoid">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-semibold text-stone-900">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 print:hidden">
          <Link
            href="/auth/register"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-900 px-6 text-base font-semibold text-white transition hover:bg-rose-600"
          >
            Начать — это бесплатно
          </Link>
        </div>
      </section>

      <section className="bg-white py-12 print:py-4" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-stone-900">
            Частые вопросы
          </h2>
          <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 print:break-inside-avoid" open>
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium text-stone-900">
                  {item.q}
                  <span className="text-stone-400 transition group-open:rotate-180 print:hidden" aria-hidden>
                    ▾
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-stone-600">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-stone-500">
            Эта страница: <span className="font-medium text-stone-900">shoptour.kz/magazinam</span>
          </p>
        </div>
      </section>
    </main>
  );
}
