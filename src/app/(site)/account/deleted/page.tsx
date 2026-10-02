import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).account.deletedMeta };
}

export default async function AccountDeletedPage() {
  const t = await getT();
  return (
    <main className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-stone-900">{t.account.deletedTitle}</h1>
        <p className="mt-2 text-sm text-stone-500">{t.account.deletedText}</p>
        <Link
          href="/catalog"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          {t.notFound.toCatalog}
        </Link>
      </div>
    </main>
  );
}
