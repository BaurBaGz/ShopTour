import Image from "next/image";
import type { Store } from "@/lib/data/types";
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
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={store.name}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-stone-400">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {store.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-300">
              <span>{store.city}</span>
              <span className="hidden text-stone-600 sm:inline">·</span>
              <span>{store.address}</span>
            </p>
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
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#20bd5a]"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
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
                  href={
                    store.instagram.startsWith("http")
                      ? store.instagram
                      : `https://instagram.com/${store.instagram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/10 px-4 py-2 font-medium backdrop-blur-sm transition hover:bg-white/20"
                >
                  Instagram
                </a>
              )}
              <span className="rounded-full bg-rose-600/80 px-4 py-2 font-medium">
                {productCount}{" "}
                {productCount === 1
                  ? "товар"
                  : productCount < 5
                    ? "товара"
                    : "товаров"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
