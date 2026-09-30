import { AccountSync } from "@/components/account/account-sync";
import { PageViewTracker } from "@/components/analytics/track-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getSessionUser } from "@/lib/auth/session";

// Публичная часть сайта: шапка и подвал. У админки (/admin) своё оформление.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <>
      {/* Избранное и маршруты вошедшего покупателя — одинаковые на всех устройствах */}
      <AccountSync userId={user?.id ?? null} />
      <PageViewTracker />
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </>
  );
}
