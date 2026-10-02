import { FOR_STORES } from "@/lib/i18n/content/for-stores";
import { getLocale } from "@/lib/i18n/server";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const c = FOR_STORES[await getLocale()];
  return pageMeta({ title: c.metaTitle, description: c.metaDescription, path: "/magazinam" });
}

// Памятка для владельцев магазинов: открыть с телефона при встрече, отправить ссылкой или распечатать
export default async function ForStoresPage() {
  const c = FOR_STORES[await getLocale()];
  return (
    <main className="print:text-[12px]">
      <section className="relative overflow-hidden bg-stone-900 text-white print:bg-white print:text-stone-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(225,29,72,0.35),transparent_55%)] print:hidden" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 print:py-6">
          <p className="text-sm font-medium text-rose-300 print:text-rose-700">{c.kicker}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {c.heading}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-300 print:text-stone-600">
            {c.lead}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
            <Link
              href="/auth/register"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-rose-600 px-6 text-base font-semibold text-white transition hover:bg-rose-500"
            >
              {c.connect}
            </Link>
            <Link
              href="/auth/login?next=/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-6 text-base font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {c.alreadyIn}
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone-400 print:text-stone-600">{c.tagline}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 print:py-4" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold tracking-tight text-stone-900">
          {c.howTitle}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {c.how.map(({ title, text }, i) => (
            <li key={title} className="rounded-2xl border border-stone-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">{i + 1}</span>
              <p className="mt-3 font-semibold text-stone-900">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-12 print:py-4" aria-labelledby="benefits-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="benefits-title" className="text-2xl font-semibold tracking-tight text-stone-900">
            {c.benefitsTitle}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
            {c.benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-stone-200 p-5 print:break-inside-avoid">
                <p className="text-2xl" aria-hidden>
                  {b.icon}
                </p>
                <p className="mt-2 font-semibold text-stone-900">{b.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 print:break-before-page print:py-4" aria-labelledby="steps-title">
        <h2 id="steps-title" className="text-2xl font-semibold tracking-tight text-stone-900">
          {c.stepsTitle}
        </h2>
        <ol className="mt-6 flex flex-col gap-3">
          {c.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 print:break-inside-avoid">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-semibold text-stone-900">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 print:hidden">
          <Link
            href="/auth/register"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-stone-900 px-6 text-base font-semibold text-white transition hover:bg-rose-600"
          >
            {c.start}
          </Link>
        </div>
      </section>

      <section className="bg-white py-12 print:py-4" aria-labelledby="faq-title">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-stone-900">
            {c.faqTitle}
          </h2>
          <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200">
            {c.faq.map((item) => (
              <details key={item.q} className="group px-5 print:break-inside-avoid" open>
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium text-stone-900">
                  {item.q}
                  <span className="text-stone-400 transition group-open:rotate-180 print:hidden" aria-hidden>
                    ▾
                  </span>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-stone-600">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-stone-500">
            {c.thisPage} <span className="font-medium text-stone-900">shoptour.kz/magazinam</span>
          </p>
        </div>
      </section>
    </main>
  );
}
