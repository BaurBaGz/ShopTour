import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PRIVACY } from "@/lib/i18n/content/privacy";
import { getLocale, getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const link = "inline-flex min-h-11 items-center hover:text-stone-900";
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/shoptour-logo-black.svg" alt="Shop Tour" width={96} height={28} className="h-7 w-auto" />
          <p className="mt-1 text-sm text-stone-500">{t.nav.tagline}</p>
          <LanguageSwitcher className="mt-3 -ml-2" />
        </div>
        <div className="flex flex-wrap gap-x-6 text-sm text-stone-600">
          <Link href="/catalog" className={link}>
            {t.nav.catalog}
          </Link>
          <Link href="/sale" className={link}>
            {t.nav.sale}
          </Link>
          <Link href="/stores" className={link}>
            {t.nav.storesMap}
          </Link>
          <Link href="/magazinam" className={link}>
            {t.nav.forStores}
          </Link>
          <Link href="/privacy" className={link}>
            {PRIVACY[locale].footerLink}
          </Link>
        </div>
      </div>
    </footer>
  );
}
