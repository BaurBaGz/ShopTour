"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils/cn";

type ShowOnMapLinkProps = {
  storeId: string;
  /** Товар, с которого пришли, — на карте он будет первым и выделен */
  productId?: string;
  children: React.ReactNode;
  className?: string;
};

/** Адрес магазина как ссылка: карта с выбранным магазином и его товарами */
export function ShowOnMapLink({ storeId, productId, children, className }: ShowOnMapLinkProps) {
  const params = new URLSearchParams({ store: storeId });
  if (productId) params.set("product", productId);

  return (
    <Link
      href={`/stores?${params.toString()}`}
      title="Показать на карте"
      onClick={() => track({ type: "map_click", storeId })}
      className={cn(
        "group inline-flex min-h-11 items-center gap-1 py-1 underline decoration-dotted underline-offset-4 transition hover:decoration-solid",
        className,
      )}
    >
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
      <span>
        {children}
        <span className="sr-only"> — показать на карте</span>
      </span>
    </Link>
  );
}
