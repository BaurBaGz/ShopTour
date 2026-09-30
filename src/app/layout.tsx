import type { Metadata } from "next";
import { Geist_Mono, Onest } from "next/font/google";
import { NavigationTracker } from "@/components/layout/navigation-tracker";
import { Toaster } from "@/components/ui/toaster";
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

export const metadata: Metadata = {
  title: "ShopTour — маркетплейс одежды вашего города",
  description:
    "Каталог товаров от локальных магазинов. Находите магазины рядом и покупайте у соседей.",
  // Фавикон — монограмма ST, иконка для телефона — квадратный знак бренда
  icons: {
    icon: [{ url: "/logos/shoptour-favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logos/shoptour-app-icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${onest.variable} ${geistMono.variable} flex min-h-screen flex-col bg-stone-50 text-stone-900 antialiased`}
      >
        <NavigationTracker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
