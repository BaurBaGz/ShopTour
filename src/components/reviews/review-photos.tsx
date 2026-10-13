"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { reviewPhotoUrl } from "@/lib/review-photo-url";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

export type ReviewPhoto = { path: string; author: string };

/** Фото на весь экран: стрелки, свайп-кнопки, Esc — закрыть */
function Lightbox({ photos, index, onClose }: { photos: ReviewPhoto[]; index: number; onClose: () => void }) {
  const r = useT().reviews;
  const [current, setCurrent] = useState(index);
  const go = useCallback((step: number) => setCurrent((i) => (i + step + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  const photo = photos[current];
  const arrow = "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25";

  return (
    <div data-lightbox role="dialog" aria-modal="true" aria-label={r.buyerPhotos} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative h-[85vh] w-[92vw] max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <Image src={reviewPhotoUrl(photo.path)} alt={r.photoAlt(photo.author, current + 1)} fill className="object-contain" sizes="92vw" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={r.prevPhoto} className={cn(arrow, "left-1")}>
              ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label={r.nextPhoto} className={cn(arrow, "right-1")}>
              ›
            </button>
          </>
        )}
        <p className="absolute inset-x-0 -bottom-8 text-center text-sm text-white/80">
          {photo.author} · {current + 1}/{photos.length}
        </p>
      </div>
      <button type="button" onClick={onClose} aria-label={r.closePhoto} className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white hover:bg-white/15">
        ✕
      </button>
    </div>
  );
}

/** Ряд миниатюр; нажатие открывает фото крупно */
export function ReviewPhotos({ photos, size = "md", className }: { photos: ReviewPhoto[]; size?: "md" | "lg"; className?: string }) {
  const r = useT().reviews;
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  if (photos.length === 0) return null;
  const box = size === "lg" ? "h-24 w-24 sm:h-28 sm:w-28" : "h-20 w-20";

  return (
    <>
      <div className={cn("flex gap-2 overflow-x-auto", className)}>
        {photos.map((photo, i) => (
          <button
            key={photo.path}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${r.openPhoto}: ${r.photoAlt(photo.author, i + 1)}`}
            className={cn("relative shrink-0 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200 transition hover:opacity-90", box)}
          >
            <Image src={reviewPhotoUrl(photo.path)} alt="" fill className="object-cover" sizes="112px" />
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onClose={close} />}
    </>
  );
}
