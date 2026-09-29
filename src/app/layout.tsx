import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationTracker } from "@/components/layout/navigation-tracker";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopTour — маркетплейс одежды вашего города",
  description:
    "Каталог товаров от локальных магазинов. Находите магазины рядом и покупайте у соседей.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-stone-50 text-stone-900 antialiased`}
      >
        <NavigationTracker />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
