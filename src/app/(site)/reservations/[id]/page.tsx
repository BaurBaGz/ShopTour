import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/catalog/auto-refresh";
import { ShowOnMapLink } from "@/components/store/show-on-map-link";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getSessionUser } from "@/lib/auth/session";
import { formatPhone, STATUS_LABELS, VISIT_LABELS } from "@/lib/reservations";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import type { ReservationStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Бронь — ShopTour",
  robots: { index: false },
};

type PageProps = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_STYLE: Record<ReservationStatus, { icon: string; box: string; text: string }> = {
  new: { icon: "⏳", box: "bg-amber-50 border-amber-200", text: "Мы отправили бронь магазину. Обычно отвечают в течение часа — страница обновится сама." },
  confirmed: { icon: "✅", box: "bg-emerald-50 border-emerald-200", text: "Вещь ждёт вас. Назовите в магазине имя — вас найдут по брони." },
  declined: { icon: "❌", box: "bg-stone-100 border-stone-200", text: "К сожалению, этой вещи уже нет. Посмотрите похожие в каталоге." },
  completed: { icon: "🛍", box: "bg-emerald-50 border-emerald-200", text: "Спасибо за покупку!" },
  no_show: { icon: "⌛", box: "bg-stone-100 border-stone-200", text: "Бронь закрыта. Можно отложить вещь снова." },
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
  const contact = store?.whatsapp ?? store?.phone ?? null;
  const whatsapp = contact
    ? buildWhatsAppUrl(contact, `Здравствуйте! Я забронировал(а) на ShopTour «${r.product_name}»${r.size ? `, размер ${r.size}` : ""}. Имя: ${r.customer_name}.`)
    : null;

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 sm:py-12">
      {r.status === "new" && <AutoRefresh />}

      <div className={cn("rounded-3xl border p-5 sm:p-6", style.box)} role="status">
        <p className="text-3xl" aria-hidden>
          {style.icon}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{STATUS_LABELS[r.status]}</h1>
        <p className="mt-1 text-stone-700">{style.text}</p>
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
            {r.size ? `Размер ${r.size} · ` : ""}
            {formatPrice(r.price)}
          </p>
          <p className="mt-2 text-stone-500">
            {r.customer_name}, {maskPhone(r.customer_phone)} · придёт {VISIT_LABELS[r.visit]}
          </p>
        </div>
      </section>

      {store && (
        <section className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5">
          <p className="text-xs text-stone-500">Магазин</p>
          <Link href={`/s/${store.slug}`} className="block font-semibold text-stone-900 hover:text-rose-600">
            {store.name}
          </Link>
          <div>
            <ShowOnMapLink storeId={store.id} className="text-sm text-stone-600 hover:text-rose-600">
              {store.city}, {store.address}
            </ShowOnMapLink>
          </div>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#15803D] px-5 text-sm font-semibold text-white transition hover:bg-[#166534]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Написать магазину
            </a>
          )}
        </section>
      )}

      <p className="text-center text-sm text-stone-500">
        {user
          ? r.user_id === user.id && (
              <>
                Бронь сохранена в <Link href="/account" className="font-medium text-rose-600 hover:text-rose-700">вашем аккаунте</Link>.
              </>
            )
          : "Сохраните эту страницу в закладки, чтобы вернуться к брони."}{" "}
        <Link href="/catalog" className="font-medium text-stone-700 hover:text-rose-600">
          В каталог →
        </Link>
      </p>
    </main>
  );
}
