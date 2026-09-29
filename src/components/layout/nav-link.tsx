"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type NavLinkProps = {
  href: string;
  label: string;
  /** Короткая подпись для телефона */
  shortLabel?: string;
};

/** Пункт меню шапки; текущий раздел выделен (и объявлен экранным читалкам) */
export function NavLink({ href, label, shortLabel }: NavLinkProps) {
  const pathname = usePathname();
  // /stores — только сама карта; страница отдельного магазина — это не раздел «Карта»
  const active = href === "/stores" ? pathname === "/stores" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-2 text-[13px] font-medium transition sm:px-4 sm:text-sm",
        active
          ? "bg-stone-100 text-stone-900"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
      )}
    >
      {shortLabel ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </Link>
  );
}
