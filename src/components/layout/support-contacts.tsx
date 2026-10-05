"use client";

import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useT } from "@/lib/i18n/client";
import { SUPPORT_TELEGRAM, supportTelegramUrl, supportWhatsAppUrl } from "@/lib/support";
import { cn } from "@/lib/utils/cn";

/** «Нужна помощь?» — WhatsApp и Telegram команды ShopTour */
export function SupportContacts({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const t = useT();
  const c = t.support;
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition";
  return (
    <section className={cn("rounded-2xl border p-5", tone === "dark" ? "border-white/15 bg-white/5" : "border-stone-200 bg-white", className)}>
      <h2 className={cn("text-lg font-semibold", tone === "dark" ? "text-white" : "text-stone-900")}>{c.title}</h2>
      <p className={cn("mt-1 text-sm", tone === "dark" ? "text-stone-300" : "text-stone-500")}>{c.text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={supportWhatsAppUrl(c.whatsappMessage)} target="_blank" rel="noopener noreferrer" className={cn(button, "bg-[#15803D] text-white hover:bg-[#166534]")}>
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </a>
        <a
          href={supportTelegramUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(button, tone === "dark" ? "bg-white/10 text-white hover:bg-white/20" : "text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50")}
        >
          Telegram @{SUPPORT_TELEGRAM}
        </a>
      </div>
    </section>
  );
}
