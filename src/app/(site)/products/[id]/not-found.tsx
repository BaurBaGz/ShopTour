import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function ProductNotFound() {
  const t = await getT();
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">{t.notFound.productTitle}</h1>
      <p className="mt-2 text-stone-500">{t.notFound.productText}</p>
      <Link href="/catalog" className="mt-8 rounded-2xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-600">
        {t.notFound.goToCatalog}
      </Link>
    </main>
  );
}
