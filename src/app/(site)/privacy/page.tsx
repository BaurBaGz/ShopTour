import { SUPPORT_TELEGRAM, SUPPORT_WHATSAPP_LABEL, supportTelegramUrl, supportWhatsAppUrl } from "@/lib/support";
import type { Metadata } from "next";
import { PRIVACY } from "@/lib/i18n/content/privacy";
import { getLocale, getT } from "@/lib/i18n/server";
import { OPERATOR_NAME, PRIVACY_EMAIL, PRIVACY_UPDATED } from "@/lib/legal";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const c = PRIVACY[await getLocale()];
  return pageMeta({ title: c.metaTitle, description: c.sections[0].blocks[0] as string, path: "/privacy" });
}

// Политика конфиденциальности: что собираем, зачем, кому передаём и как это удалить
export default async function PrivacyPage() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const c = PRIVACY[locale];
  const updated = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${PRIVACY_UPDATED}T00:00:00Z`),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{c.title}</h1>
      <p className="mt-2 text-sm text-stone-500">{c.updated(updated)}</p>

      <dl className="mt-6 grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-stone-500">{c.operatorLabel}</dt>
          <dd className="mt-0.5 font-medium text-stone-900">{OPERATOR_NAME ?? c.operatorFallback}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">{c.contactLabel}</dt>
          <dd className="mt-0.5 font-medium text-stone-900">
            {PRIVACY_EMAIL ? (
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-rose-600 hover:text-rose-700">
                {PRIVACY_EMAIL}
              </a>
            ) : (
              <>
                {t.support.privacyContacts}{" "}
                <a href={supportWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700">
                  WhatsApp {SUPPORT_WHATSAPP_LABEL}
                </a>
                {" · "}
                <a href={supportTelegramUrl()} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700">
                  Telegram @{SUPPORT_TELEGRAM}
                </a>
              </>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-8">
        {c.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold tracking-tight text-stone-900">{section.title}</h2>
            <div className="mt-2 flex flex-col gap-3 leading-relaxed text-stone-700">
              {section.blocks.map((block, i) =>
                typeof block === "string" ? (
                  <p key={i}>{block}</p>
                ) : (
                  <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
                    {block.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
