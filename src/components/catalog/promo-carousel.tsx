"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils/cn";

const HIDDEN_KEY = "shoptour:promo-hidden";
const hiddenListeners = new Set<() => void>();

// «Скрыть баннеры» запоминается в браузере; при недоступном хранилище — просто показываем
function readHidden(): boolean {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeHidden(listener: () => void) {
  hiddenListeners.add(listener);
  return () => {
    hiddenListeners.delete(listener);
  };
}

function hidePromo() {
  try {
    window.localStorage.setItem(HIDDEN_KEY, "1");
  } catch {
    // Хранилище недоступно — скрываем до перезагрузки
  }
  hiddenListeners.forEach((listener) => listener());
}

const steps = [
  {
    title: "Найдите вещь",
    text: "Фильтры по размеру, цене и категории, скидки и остатки по размерам.",
  },
  {
    title: "Отметьте сердечком",
    text: "Избранное без регистрации. На карте видно, в каком магазине что лежит.",
    href: "/stores?view=favorites",
    cta: "Избранное на карте",
  },
  {
    title: "Постройте маршрут",
    text: "Магазины с вашим избранным в самом коротком порядке — сразу в Google или Яндекс Карты.",
    href: "/favorites",
    cta: "Построить маршрут",
  },
];

const SLIDE_COUNT = 2;

/** Баннеры над каталогом: идея сервиса и как им пользоваться. Листаются пальцем и точками. */
export function PromoCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => false);

  // Текущий баннер — тот, чей левый край ближе всего к началу ленты (с учётом отступа)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const start = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).scrollPaddingLeft || "0");
      const slides = Array.from(track.children) as HTMLElement[];
      const distances = slides.map((slide) => Math.abs(slide.getBoundingClientRect().left - start));
      setActive(distances.indexOf(Math.min(...distances)));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [hidden]);

  // scrollIntoView учитывает scroll-padding ленты и не двигает страницу по вертикали
  const goTo = (index: number) => {
    const slide = trackRef.current?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  if (hidden) return null;

  return (
    <section aria-roledescription="карусель" aria-label="Как работает ShopTour" className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-1 sm:scroll-px-0 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {/* 1. Идея */}
        <div
          role="group"
          aria-roledescription="слайд"
          aria-label={`1 из ${SLIDE_COUNT}`}
          className="relative flex w-[88%] shrink-0 snap-start flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 ring-1 ring-rose-100 sm:w-[92%] sm:p-8"
        >
          <p className="text-2xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-3xl">
            Найдите стиль
            <span className="block text-rose-600">в своём городе</span>
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
            ShopTour собирает одежду из независимых магазинов Алматы в один каталог. Отмечайте
            понравившееся и стройте маршрут по магазинам, чтобы примерить всё за одну прогулку.
          </p>
          <button
            type="button"
            onClick={() => goTo(1)}
            className="mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold text-rose-700 hover:text-rose-800"
          >
            Как это работает →
          </button>
        </div>

        {/* 2. Как это работает */}
        <div
          role="group"
          aria-roledescription="слайд"
          aria-label={`2 из ${SLIDE_COUNT}`}
          className="flex w-[88%] shrink-0 snap-start flex-col rounded-3xl bg-stone-900 p-6 text-white sm:w-[92%] sm:p-8"
        >
          <p className="text-xl font-semibold tracking-tight sm:text-2xl">Как это работает</p>
          <p className="mt-1 text-sm text-stone-300">Примерьте в магазине то, что выбрали онлайн</p>
          <ol className="mt-4 grid flex-1 gap-3 sm:grid-cols-3 sm:gap-6">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3 sm:flex-col sm:gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-stone-900"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 hidden text-sm leading-relaxed text-stone-300 sm:block">
                    {step.text}
                  </p>
                  {step.href && (
                    <Link
                      href={step.href}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-rose-300 hover:text-rose-200 sm:min-h-0 sm:pt-1"
                    >
                      {step.cta} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Баннер ${i + 1} из ${SLIDE_COUNT}`}
              aria-current={active === i}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span
                className={cn(
                  "h-2 rounded-full transition-all",
                  active === i ? "w-5 bg-stone-900" : "w-2 bg-stone-300",
                )}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={hidePromo}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        >
          Скрыть ✕
        </button>
      </div>
    </section>
  );
}
