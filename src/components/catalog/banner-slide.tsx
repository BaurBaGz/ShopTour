import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { BannerKind, BannerTheme } from "@/types/database";

export type BannerData = {
  id: string;
  kind: BannerKind;
  title: string;
  accent: string | null;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  theme: BannerTheme;
};

const THEMES: Record<BannerTheme, { box: string; title: string; accent: string; body: string; cta: string }> = {
  rose: {
    box: "bg-gradient-to-br from-rose-50 via-white to-amber-50 ring-1 ring-rose-100",
    title: "text-stone-900",
    accent: "text-rose-600",
    body: "text-stone-600",
    cta: "text-rose-700 hover:text-rose-800",
  },
  dark: {
    box: "bg-stone-900",
    title: "text-white",
    accent: "text-rose-300",
    body: "text-stone-300",
    cta: "text-rose-300 hover:text-rose-200",
  },
  light: {
    box: "bg-white ring-1 ring-stone-200",
    title: "text-stone-900",
    accent: "text-rose-600",
    body: "text-stone-600",
    cta: "text-rose-700 hover:text-rose-800",
  },
};

// Встроенные шаги баннера «Как это работает»
const STEPS = [
  { title: "Найдите вещь", text: "Фильтры по размеру, цене и категории, скидки и остатки по размерам." },
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

type BannerSlideProps = {
  banner: BannerData;
  /** Для ссылки «#next» — пролистать к следующему баннеру */
  onNext?: () => void;
  className?: string;
};

/** Содержимое одного баннера. Размер задаёт родитель (карусель или превью в админке). */
export function BannerSlide({ banner, onNext, className }: BannerSlideProps) {
  const theme = THEMES[banner.theme];

  if (banner.kind === "steps") {
    return (
      <div className={cn("flex h-full flex-col rounded-3xl p-6 sm:p-8", theme.box, className)}>
        <p className={cn("text-xl font-semibold tracking-tight sm:text-2xl", theme.title)}>{banner.title}</p>
        {banner.body && <p className={cn("mt-1 text-sm", theme.body)}>{banner.body}</p>}
        <ol className="mt-4 grid flex-1 gap-3 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 sm:flex-col sm:gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  banner.theme === "dark" ? "bg-white text-stone-900" : "bg-stone-900 text-white",
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className={cn("font-semibold", theme.title)}>{step.title}</p>
                <p className={cn("mt-0.5 hidden text-sm leading-relaxed sm:block", theme.body)}>{step.text}</p>
                {step.href && (
                  <Link href={step.href} className={cn("inline-flex min-h-11 items-center text-sm font-semibold sm:min-h-0 sm:pt-1", theme.cta)}>
                    {step.cta} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const cta =
    banner.cta_label && banner.cta_href ? (
      banner.cta_href === "#next" ? (
        <button type="button" onClick={onNext} className={cn("mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold", theme.cta)}>
          {banner.cta_label} →
        </button>
      ) : /^https?:\/\//.test(banner.cta_href) ? (
        <a href={banner.cta_href} target="_blank" rel="noopener noreferrer" className={cn("mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold", theme.cta)}>
          {banner.cta_label} →
        </a>
      ) : (
        <Link href={banner.cta_href} className={cn("mt-4 inline-flex min-h-11 items-center self-start text-sm font-semibold", theme.cta)}>
          {banner.cta_label} →
        </Link>
      )
    ) : null;

  return (
    <div className={cn("flex h-full overflow-hidden rounded-3xl", theme.box, className)}>
      <div className="flex min-w-0 flex-1 flex-col justify-center p-6 sm:p-8">
        <p className={cn("text-2xl font-semibold leading-tight tracking-tight sm:text-3xl", theme.title)}>
          {banner.title}
          {banner.accent && <span className={cn("block", theme.accent)}>{banner.accent}</span>}
        </p>
        {banner.body && <p className={cn("mt-3 max-w-xl text-sm leading-relaxed sm:text-base", theme.body)}>{banner.body}</p>}
        {cta}
      </div>
      {banner.image_url && (
        // Фото справа: на телефоне узкой полосой, на компьютере — крупно
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.image_url} alt="" className="w-[34%] shrink-0 object-cover sm:w-[40%]" />
      )}
    </div>
  );
}
