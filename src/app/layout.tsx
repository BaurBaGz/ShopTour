import type { Metadata } from "next";
import { Geist_Mono, Onest } from "next/font/google";
import { NavigationTracker } from "@/components/layout/navigation-tracker";
import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider } from "@/lib/i18n/client";
import { getLocale, getT } from "@/lib/i18n/server";
import { pageMeta, SITE_URL } from "@/lib/seo";
import "./globals.css";

// Основной шрифт бренда Shop Tour
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    // Основа для относительных адресов в превью ссылок (og:image, canonical)
    metadataBase: new URL(SITE_URL),
    ...pageMeta({
      title: t.meta.siteTitle,
      description: t.meta.siteDescription,
    }),
    // Фавикон — монограмма ST, иконка для телефона — квадратный знак бренда
    icons: {
      icon: [{ url: "/logos/shoptour-favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/logos/shoptour-app-icon.svg", type: "image/svg+xml" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Язык выбран переключателем и запомнен в cookie
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body
        className={`${onest.variable} ${geistMono.variable} flex min-h-screen flex-col bg-stone-50 text-stone-900 antialiased`}
      >
        <LocaleProvider locale={locale}>
          <NavigationTracker />
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
