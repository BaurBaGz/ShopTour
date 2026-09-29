import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Нет доступа — ShopTour", robots: { index: false } };

export default function AdminNoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Нет доступа к админке</h1>
        <p className="mt-2 text-sm text-stone-500">
          Ваш аккаунт не добавлен в сотрудники ShopTour. Попросите администратора выдать доступ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/catalog" className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-rose-600">
            На сайт
          </Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
            Кабинет магазина
          </Link>
        </div>
      </div>
    </main>
  );
}
