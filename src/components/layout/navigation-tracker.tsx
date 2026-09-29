"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { markInAppNavigation } from "@/lib/navigation-history";

/** Отмечает, что пользователь перешёл по сайту без перезагрузки страницы */
export function NavigationTracker() {
  const pathname = usePathname();
  const first = useRef(pathname);

  useEffect(() => {
    if (pathname !== first.current) markInAppNavigation();
  }, [pathname]);

  return null;
}
