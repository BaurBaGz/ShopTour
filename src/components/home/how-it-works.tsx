import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Найдите вещь",
    text: "Каталог одежды из магазинов Алматы: фильтры по размеру, цене и категории, скидки и остатки по размерам.",
    href: "/catalog",
    cta: "Открыть каталог",
  },
  {
    number: "2",
    title: "Отметьте сердечком",
    text: "Сохраняйте понравившееся в избранное — без регистрации. На карте видно, в каком магазине что лежит.",
    href: "/stores?view=favorites",
    cta: "Избранное на карте",
  },
  {
    number: "3",
    title: "Постройте Shop Tour",
    text: "Маршрут по магазинам с вашим избранным в самом коротком порядке — и сразу в Google или Яндекс Карты.",
    href: "/favorites",
    cta: "Построить маршрут",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-stone-200 bg-stone-50 py-16 sm:py-20" aria-labelledby="how-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="how-title" className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          Как это работает
        </h2>
        <p className="mt-2 text-stone-500">Примерьте в магазине то, что выбрали онлайн</p>

        <ol className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {steps.map((step) => (
            <li
              key={step.number}
              className="flex flex-col rounded-3xl border border-stone-200/80 bg-white p-6"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white"
                aria-hidden
              >
                {step.number}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{step.text}</p>
              <Link
                href={step.href}
                className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-rose-700 hover:text-rose-800"
              >
                {step.cta} →
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
