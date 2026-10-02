import type { StoreValue } from "@/lib/data/analytics";
import { formatPrice } from "@/lib/utils/format";

// С этого дня считаются нажатия и источник визита; брони считались и раньше
const TRACKING_SINCE = "2 октября 2026";

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** «Что дал ShopTour»: главный итог для магазина — купили, собирались прийти, узнали о магазине */
export function StoreValueBlock({ value }: { value: StoreValue }) {
  const people = (n: number) => `${n} ${plural(n, "человек", "человека", "человек")}`;
  const intents = [
    { label: "Написали в WhatsApp", value: value.whatsappClicks },
    { label: "Нажали «Позвонить»", value: value.phoneClicks },
    { label: "Открыли на карте", value: value.mapClicks },
    { label: "Добавили в маршрут", value: value.tourAdds },
  ];

  return (
    <section aria-labelledby="store-value-title" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 id="store-value-title" className="text-lg font-semibold text-stone-900">
        Что дал ShopTour за {value.days} {plural(value.days, "день", "дня", "дней")}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-sm text-emerald-900">Забрали по броням</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-900">{value.pickedUp}</p>
          <p className="mt-1 text-sm font-medium text-emerald-800">на {formatPrice(value.pickedUpSum)}</p>
        </div>
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-sm text-stone-600">Всего броней</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{value.reservations}</p>
          <p className="mt-1 text-sm text-stone-500">
            {value.waitingPickup > 0 ? `${value.waitingPickup} отложено, ждут покупателя` : "отложенных сейчас нет"}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4">
          <p className="text-sm text-rose-900">Нашли вас через ShopTour</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-rose-900">{value.foundVisitors}</p>
          <p className="mt-1 text-sm text-rose-800">
            {plural(value.foundVisitors, "новый посетитель", "новых посетителя", "новых посетителей")} из каталога, поиска и карты
          </p>
        </div>
      </div>

      <h3 className="mt-5 text-sm font-medium text-stone-700">Собирались прийти или связаться</h3>
      <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {intents.map((item) => (
          <div key={item.label} className="rounded-xl border border-stone-200 px-3 py-2.5">
            <dt className="text-xs text-stone-500">{item.label}</dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums text-stone-900">{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-stone-600">
        По вашей собственной ссылке (Instagram, мессенджеры) пришли {people(value.ownLinkVisitors)} — это ваши подписчики, а не
        новые покупатели.
      </p>
      <p className="mt-2 text-xs text-stone-500">
        «Забрали» — брони, которые магазин отметил как выкупленные. Нажатия и источник визита считаются с {TRACKING_SINCE};
        считаются люди, а не клики. Собственные просмотры сотрудников магазина не учитываются.
      </p>
    </section>
  );
}
