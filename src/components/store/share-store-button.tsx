"use client";

import { showToast } from "@/lib/toast";

/** «Поделиться» витриной: системное меню на телефоне, иначе — копирование ссылки */
export function ShareStoreButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const share = async () => {
    const url = `${window.location.origin}/s/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — ShopTour`, url });
        return;
      } catch (error) {
        // Закрыли меню — ничего не делаем; иначе пробуем скопировать
        if ((error as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: "Ссылка на витрину скопирована" });
    } catch {
      showToast({ message: url });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={className ?? "rounded-full bg-white/10 px-4 py-2 font-medium backdrop-blur-sm transition hover:bg-white/20"}
    >
      Поделиться
    </button>
  );
}
