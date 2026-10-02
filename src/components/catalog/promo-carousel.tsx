"use client";

import { useEffect, useRef, useState } from "react";
import { BannerSlide, type BannerData } from "@/components/catalog/banner-slide";
import { track } from "@/lib/analytics";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

// Раньше баннеры можно было скрыть — теперь их видят все. Старую отметку «скрыто» стираем.
const LEGACY_HIDDEN_KEY = "shoptour:promo-hidden";

/** Баннеры над каталогом: идея сервиса и как им пользоваться. Листаются пальцем и точками. */
export function PromoCarousel({ banners }: { banners: BannerData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const t = useT();
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_HIDDEN_KEY);
    } catch {
      // хранилище недоступно — и отметки нет
    }
  }, []);
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
  }, []);

  // Показ баннера считаем, когда он стал текущим, — один раз за открытие страницы
  const viewedRef = useRef(new Set<string>());
  const activeId = banners[active]?.id;
  useEffect(() => {
    if (!activeId || viewedRef.current.has(activeId)) return;
    viewedRef.current.add(activeId);
    track({ type: "banner_view", bannerId: activeId });
  }, [activeId]);

  // scrollIntoView учитывает scroll-padding ленты и не двигает страницу по вертикали
  const goTo = (index: number) => {
    const slide = trackRef.current?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  if (slideCount === 0) return null;

  return (
    <section aria-roledescription={t.carousel.roleDescription} aria-label={t.carousel.label} className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-1 sm:scroll-px-0 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription={t.carousel.slideRole}
            aria-label={t.carousel.slideOf(index + 1, slideCount)}
            className={cn("shrink-0 snap-start", slideCount > 1 ? "w-[88%] sm:w-[92%]" : "w-full")}
          >
            <BannerSlide
              banner={banner}
              onNext={() => goTo((index + 1) % slideCount)}
              onCtaClick={() => track({ type: "banner_click", bannerId: banner.id })}
            />
          </div>
        ))}
      </div>

      {slideCount > 1 && (
      <div className="mt-2 flex items-center gap-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: slideCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t.carousel.bannerOf(i + 1, slideCount)}
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
      </div>
      )}
    </section>
  );
}
