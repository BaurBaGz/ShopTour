import { cn } from "@/lib/utils/cn";

type StarsProps = {
  /** Оценка 0–5, может быть дробной (средняя) */
  value: number;
  label: string;
  className?: string;
};

/** Звёзды оценки: заливка по доле, чтобы 4.5 выглядело как четыре с половиной */
export function Stars({ value, label, className }: StarsProps) {
  const pct = Math.max(0, Math.min(5, value)) * 20;
  return (
    <span role="img" aria-label={label} className={cn("relative inline-block leading-none tracking-[0.1em]", className)}>
      <span className="text-stone-300" aria-hidden>
        ★★★★★
      </span>
      <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-500" style={{ width: `${pct}%` }} aria-hidden>
        ★★★★★
      </span>
    </span>
  );
}

/** «★ 4.8 · 12 отзывов» — коротко рядом с названием магазина или товара */
export function RatingBadge({ avg, countLabel, starsLabel, note, className }: { avg: number; countLabel: string; starsLabel: string; note?: string | null; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <Stars value={avg} label={starsLabel} className="text-sm" />
      <span className="font-semibold text-stone-900">{avg.toFixed(1)}</span>
      <span className="text-stone-500">· {countLabel}</span>
      {note && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{note}</span>}
    </span>
  );
}
