"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BannerSlide, type BannerData } from "@/components/catalog/banner-slide";
import { cn } from "@/lib/utils/cn";

const HIDDEN_KEY = "shoptour:promo-hidden";
const hiddenListeners = new Set<() => void>();

// «Скрыть баннеры» запоминается в браузере; при недоступном хранилище — просто показываем
function readHidden(): string | null {
  try {
    return window.localStorage.getItem(HIDDEN_KEY);
  } catch {
    return null;
  }
}

function subscribeHidden(listener: () => void) {
  hiddenListeners.add(listener);
  return () => {
    hiddenListeners.delete(listener);
  };
}

function hidePromo(signature: string) {
  try {
    window.localStorage.setItem(HIDDEN_KEY, signature);
  } catch {
    // Хранилище недоступно — скрываем до перезагрузки
  }
  hiddenListeners.forEach((listener) => listener());
}

/** Баннеры над каталогом: идея сервиса и как им пользоваться. Листаются пальцем и точками. */
export function PromoCarousel({ banners }: { banners: BannerData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // «Скрыть» действует, пока баннеры не поменялись: новую акцию увидят и те, кто скрывал
  const signature = banners.map((b) => b.id).join(",");
  const hiddenSignature = useSyncExternalStore(subscribeHidden, readHidden, () => null);
  const hidden = hiddenSignature === signature;
  const slideCount = banners.length;

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

  if (hidden || slideCount === 0) return null;

  return (
    <section aria-roledescription="карусель" aria-label="Как работает ShopTour" className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-1 sm:scroll-px-0 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="слайд"
            aria-label={`${index + 1} из ${slideCount}`}
            className={cn("shrink-0 snap-start", slideCount > 1 ? "w-[88%] sm:w-[92%]" : "w-full")}
          >
            <BannerSlide banner={banner} onNext={() => goTo((index + 1) % slideCount)} />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {slideCount > 1 && Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Баннер ${i + 1} из ${slideCount}`}
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
          onClick={() => hidePromo(signature)}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        >
          Скрыть ✕
        </button>
      </div>
    </section>
  );
}
