import { DistanceFromMe } from "@/components/catalog/distance-from-me";
import { ShareStoreButton } from "@/components/store/share-store-button";
import { ShowOnMapLink } from "@/components/store/show-on-map-link";
import { StoreAvatar } from "@/components/store/store-avatar";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { Store } from "@/lib/data/types";
import { buildInstagramUrl } from "@/lib/utils/instagram";
import { displayPhone, telHref } from "@/lib/utils/phone";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

type StoreHeroProps = {
  store: Store;
  stats: { total: number; available: number; discounted: number };
};

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition";
const outline = `${button} bg-white text-stone-800 ring-1 ring-stone-200 hover:bg-stone-50`;

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Шапка витрины магазина — светлая, как профиль в Instagram */
export function StoreHero({ store, stats }: StoreHeroProps) {
  const contactPhone = store.whatsapp ?? store.phone;
  const whatsappHref = contactPhone
    ? buildWhatsAppUrl(contactPhone, `Здравствуйте! Пишу с ShopTour по магазину «${store.name}».`)
    : null;

  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-200 sm:h-28 sm:w-28">
            <StoreAvatar store={store} sizes="112px" textClassName="text-3xl sm:text-4xl" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{store.name}</h1>
            <ShowOnMapLink storeId={store.id} className="text-sm text-stone-600 hover:text-rose-600">
              {store.city}, {store.address}
            </ShowOnMapLink>
            <DistanceFromMe store={store} />
          </div>
        </div>

        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
          <span>
            <span className="font-semibold text-stone-900">{stats.total}</span>{" "}
            {plural(stats.total, "товар", "товара", "товаров")}
          </span>
          {stats.available < stats.total && (
            <span>
              <span className="font-semibold text-stone-900">{stats.available}</span> в наличии
            </span>
          )}
          {stats.discounted > 0 && (
            <span>
              <span className="font-semibold text-rose-600">{stats.discounted}</span> со скидкой
            </span>
          )}
        </p>

        {store.description && <p className="mt-3 max-w-2xl leading-relaxed text-stone-700">{store.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${button} bg-[#15803D] text-white hover:bg-[#166534]`}
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </a>
          )}
          {store.phone && (
            <a href={telHref(store.phone)} className={outline} title={displayPhone(store.phone)}>
              Позвонить
            </a>
          )}
          {store.instagram && (
            <a href={buildInstagramUrl(store.instagram)} target="_blank" rel="noopener noreferrer" className={outline}>
              Instagram
            </a>
          )}
          <ShareStoreButton slug={store.slug} name={store.name} className={outline} />
        </div>
        {store.phone && <p className="mt-3 text-xs text-stone-500">Телефон: {displayPhone(store.phone)}</p>}
      </div>
    </section>
  );
}
