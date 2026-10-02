"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/lib/toast";

/** «Сохранить маршрут» под названием; без входа — предлагает войти */
export function SaveTourButton({ storeIds }: { storeIds: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data }) => setLoggedIn(Boolean(data.session)));
  }, []);

  if (loggedIn === null) return null;

  if (!loggedIn) {
    const next = pathname === "/stores" ? "/stores?tour=1" : pathname;
    return (
      <Link
        href={`/auth/login?next=${encodeURIComponent(next)}`}
        className="rounded-full px-3 py-1.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
      >
        {t.tour.loginToSave}
      </Link>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setName(t.tour.defaultName(new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long" }).format(new Date())));
          setOpen(true);
        }}
        className="rounded-full px-3 py-1.5 font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
      >
        {t.tour.save}
      </button>
    );
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = name.trim().slice(0, 60);
    if (!title) return;
    setStatus("saving");
    const { error } = await createClient().from("saved_tours").insert({ name: title, store_ids: storeIds });
    if (error) {
      console.error("[account] save tour:", error.message);
      setStatus("error");
      return;
    }
    setStatus("idle");
    setOpen(false);
    showToast({ message: t.tour.saved, action: { label: t.tour.myRoutes, href: "/account#tours" } });
    router.refresh();
  };

  return (
    <form onSubmit={save} className="flex w-full flex-col gap-2 rounded-2xl bg-stone-50 p-3">
      <label htmlFor="tour-name" className="text-xs font-medium text-stone-600">
        {t.tour.nameLabel}
      </label>
      <input
        id="tour-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        autoFocus
        required
        className="min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15"
      />
      {status === "error" && <p role="alert" className="text-xs text-red-700">{t.tour.saveFailed}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="min-h-11 flex-1 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {status === "saving" ? t.tour.saving : t.tour.saveShort}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 rounded-xl px-4 text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
