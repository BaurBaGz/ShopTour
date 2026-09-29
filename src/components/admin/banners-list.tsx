"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveBannerAction, toggleBannerAction } from "@/app/admin/(panel)/banners/actions";
import { BannerSlide, type BannerData } from "@/components/catalog/banner-slide";
import { cn } from "@/lib/utils/cn";

type Row = BannerData & { is_active: boolean };

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent";

export function BannersList({ rows }: { rows: Row[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ error: string | null | undefined }>) =>
    startTransition(async () => setError((await fn()).error ?? null));

  const activeCount = rows.filter((r) => r.is_active).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-500">
        На сайте {activeCount} из {rows.length}. Баннеры видны над каталогом, пока покупатель не выбрал фильтр.
      </p>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <ol className={cn("flex flex-col gap-4", pending && "opacity-70")}>
        {rows.map((banner, index) => (
          <li key={banner.id} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-stone-500">{index + 1}</span>
              <span className="font-medium text-stone-900">{banner.title}</span>
              {banner.kind === "steps" && (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">встроенный</span>
              )}
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", banner.is_active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500")}>
                {banner.is_active ? "На сайте" : "Выключен"}
              </span>
              <div className="ml-auto flex items-center">
                <button type="button" disabled={index === 0 || pending} onClick={() => run(() => moveBannerAction(banner.id, -1))} aria-label={`Поднять «${banner.title}»`} className={iconButton}>↑</button>
                <button type="button" disabled={index === rows.length - 1 || pending} onClick={() => run(() => moveBannerAction(banner.id, 1))} aria-label={`Опустить «${banner.title}»`} className={iconButton}>↓</button>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm text-stone-700 hover:bg-stone-100">
                  <input
                    type="checkbox"
                    checked={banner.is_active}
                    disabled={pending}
                    onChange={(e) => run(() => toggleBannerAction(banner.id, e.target.checked))}
                    className="h-5 w-5 rounded accent-rose-600"
                  />
                  Показывать
                </label>
                <Link href={`/admin/banners/${banner.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
                  Изменить
                </Link>
              </div>
            </div>
            <div className={cn("mt-3 max-w-3xl", !banner.is_active && "opacity-50")}>
              <div className="min-h-44">
                <BannerSlide banner={banner} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
