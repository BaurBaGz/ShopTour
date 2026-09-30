import type { Store } from "@/lib/data/types";
import { DistanceFromMe } from "@/components/catalog/distance-from-me";
import { ShareStoreButton } from "@/components/store/share-store-button";
import { ShowOnMapLink } from "@/components/store/show-on-map-link";
import { StoreAvatar } from "@/components/store/store-avatar";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { formatProductCount } from "@/lib/utils/format";
import { buildInstagramUrl } from "@/lib/utils/instagram";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

type StoreHeroProps = {
  store: Store;
  productCount: number;
};

export function StoreHero({ store, productCount }: StoreHeroProps) {
  const contactPhone = store.whatsapp ?? store.phone;
  const whatsappHref = contactPhone
    ? buildWhatsAppUrl(
        contactPhone,
        `Здравствуйте! Пишу с ShopTour по магазину «${store.name}».`,
      )
    : null;

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-stone-900 text-white">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(225,29,72,0.35),transparent_50%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-800 ring-2 ring-white/10 sm:h-28 sm:w-28">
            <StoreAvatar store={store} sizes="112px" textClassName="text-4xl" />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {store.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-300">
              <ShowOnMapLink storeId={store.id} className="hover:text-white">
                {store.city}, {store.address}
              </ShowOnMapLink>
            </p>
            <DistanceFromMe store={store} className="mt-1 text-rose-300" />
            {store.description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-stone-300">
                {store.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#15803D] px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#166534]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Написать в WhatsApp
                </a>
              )}
              {store.phone && (
                <a
                  href={`tel:${store.phone.replace(/\s/g, "")}`}
                  className="rounded-full bg-white/10 px-4 py-2 font-medium backdrop-blur-sm transition hover:bg-white/20"
                >
                  {store.phone}
                </a>
              )}
              {store.instagram && (
                <a
                  href={buildInstagramUrl(store.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/10 px-4 py-2 font-medium backdrop-blur-sm transition hover:bg-white/20"
                >
                  Instagram
                </a>
              )}
              <ShareStoreButton slug={store.slug} name={store.name} />
              <span className="self-center px-1 text-stone-300">
                {formatProductCount(productCount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
