import { TrackedLink } from "@/components/analytics/tracked-link";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/catalog/auto-refresh";
import { ShowOnMapLink } from "@/components/store/show-on-map-link";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getSessionUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { formatPhone } from "@/lib/reservations";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { ReservationStatus } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).reservation.metaTitle, robots: { index: false } };
}

type PageProps = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Подписи и пояснения статусов — в словарях (t.reservation.status)
const STATUS_STYLE: Record<ReservationStatus, { icon: string; box: string }> = {
  new: { icon: "⏳", box: "bg-amber-50 border-amber-200" },
  confirmed: { icon: "✅", box: "bg-emerald-50 border-emerald-200" },
  declined: { icon: "❌", box: "bg-stone-100 border-stone-200" },
  completed: { icon: "🛍", box: "bg-emerald-50 border-emerald-200" },
  no_show: { icon: "⌛", box: "bg-stone-100 border-stone-200" },
};

/** Номер наполовину скрыт: ссылку на бронь могут переслать */
function maskPhone(phone: string) {
  const f = formatPhone(phone);
  return f.replace(/(\d{3}) (\d{2}) (\d{2})$/, "*** ** $3");
}

// Страница брони: ссылка — уникальный id, его знает только тот, кто бронировал
export default async function ReservationPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const t = await getT();
  const admin = createAdminClient();
  const { data: r } = await admin.from("reservations").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();

  const [{ data: store }, { data: product }, user] = await Promise.all([
    admin.from("stores").select("id, name, city, address, slug, phone, whatsapp").eq("id", r.store_id).maybeSingle(),
    r.product_id
      ? admin.from("products").select("id, images").eq("id", r.product_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getSessionUser(),
  ]);
  const style = STATUS_STYLE[r.status];
  // Запись на примерку (прокат) — свои подписи статусов
  const fitting = r.kind === "fitting";
  const statusTexts = fitting ? t.reservation.fittingStatus : t.reservation.status;
  const eventDate = r.event_date
    ? new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${r.event_date}T00:00:00Z`))
    : null;
  const contact = store?.whatsapp ?? store?.phone ?? null;
  const whatsapp = contact
    ? buildWhatsAppUrl(contact, t.reservation.whatsappMessage(r.product_name, r.size, r.customer_name))
    : null;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 sm:py-12">
      {r.status === "new" && <AutoRefresh />}

      <div className={cn("rounded-3xl border p-5 sm:p-6", style.box)} role="status">
        <p className="text-3xl" aria-hidden>
          {style.icon}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{statusTexts[r.status].label}</h1>
        <p className="mt-1 text-stone-700">{statusTexts[r.status].text}</p>
      </div>

      <section className="flex gap-4 rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
          {product?.images?.[0] && <Image src={product.images[0]} alt="" fill sizes="80px" className="object-cover" />}
        </div>
        <div className="min-w-0 text-sm">
          {product ? (
            <Link href={`/products/${product.id}`} className="font-semibold text-stone-900 hover:text-rose-600">
              {r.product_name}
            </Link>
          ) : (
            <p className="font-semibold text-stone-900">{r.product_name}</p>
          )}
          <p className="mt-1 text-stone-600">
            {fitting ? `${t.reservation.fittingLabel} · ` : ""}
            {r.size ? `${t.purchase.sizeShort(r.size)} · ` : ""}
            {formatPrice(r.price)}
          </p>
          <p className="mt-2 text-stone-500">
            {r.customer_name}, {maskPhone(r.customer_phone)} · {t.reservation.comes[r.visit]}
            {eventDate ? ` · ${t.reservation.eventLine(eventDate)}` : ""}
          </p>
        </div>
      </section>

      {store && (
        <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
          <p className="text-xs text-stone-500">{t.reservation.storeLabel}</p>
          <Link href={`/s/${store.slug}`} className="block font-semibold text-stone-900 hover:text-rose-600">
            {store.name}
          </Link>
          <div>
            <ShowOnMapLink storeId={store.id} className="text-sm text-stone-600 hover:text-rose-600">
              {store.city}, {store.address}
            </ShowOnMapLink>
          </div>
          {whatsapp && (
            <TrackedLink
              event={{ type: "whatsapp_click", storeId: store.id }}
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#15803D] px-5 text-sm font-semibold text-white transition hover:bg-[#166534]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              {t.reservation.writeStore}
            </TrackedLink>
          )}
        </section>
      )}

      <p className="text-center text-sm text-stone-500">
        {user
          ? r.user_id === user.id && (
              <>
                {t.reservation.savedPrefix} <Link href="/account" className="font-medium text-rose-600 hover:text-rose-700">{t.reservation.savedLink}</Link>.
              </>
            )
          : t.reservation.bookmarkHint}{" "}
        <Link href="/catalog" className="font-medium text-stone-700 hover:text-rose-600">
          {t.reservation.toCatalog}
        </Link>
      </p>
    </main>
  );
}
