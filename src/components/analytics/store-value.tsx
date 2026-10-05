import type { StoreValue } from "@/lib/data/analytics";
import { getT } from "@/lib/i18n/server";
import { formatPrice } from "@/lib/utils/format";

// С этого дня считаются нажатия и источник визита; брони считались и раньше
const TRACKING_SINCE = "2026-10-02";

/** «Что дал ShopTour»: главный итог для магазина — купили, собирались прийти, узнали о магазине */
export async function StoreValueBlock({ value }: { value: StoreValue }) {
  const t = await getT();
  const c = t.cabinet.value;
  const since = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${TRACKING_SINCE}T00:00:00Z`),
  );
  const intents = [
    { label: c.whatsapp, value: value.whatsappClicks },
    { label: c.phone, value: value.phoneClicks },
    { label: c.map, value: value.mapClicks },
    { label: c.route, value: value.tourAdds },
  ];

  return (
    <section aria-labelledby="store-value-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="store-value-title" className="text-lg font-semibold text-stone-900">
        {c.title(value.days)}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">{c.pickedUp}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-900">{value.pickedUp}</p>
          <p className="mt-1 text-sm font-medium text-emerald-800">{c.pickedUpSum(formatPrice(value.pickedUpSum))}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-sm text-stone-600">{c.totalReservations}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{value.reservations}</p>
          <p className="mt-1 text-sm text-stone-500">{value.waitingPickup > 0 ? c.waitingPickup(value.waitingPickup) : c.noWaiting}</p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4">
          <p className="text-sm text-rose-900">{c.found}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-rose-900">{value.foundVisitors}</p>
          <p className="mt-1 text-sm text-rose-800">{c.foundNote(value.foundVisitors)}</p>
        </div>
      </div>

      <h3 className="mt-5 text-sm font-medium text-stone-700">{c.intents}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {intents.map((item) => (
          <div key={item.label} className="rounded-xl border border-stone-200 px-3 py-2.5">
            <dt className="text-xs text-stone-500">{item.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-stone-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-stone-600">{c.ownLink(value.ownLinkVisitors)}</p>
      <p className="mt-2 text-xs text-stone-500">{c.footnote(since)}</p>
    </section>
  );
}
