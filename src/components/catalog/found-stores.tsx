import Link from "next/link";
import { StoreAvatar } from "@/components/store/store-avatar";
import type { FoundStore } from "@/lib/data/catalog";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { distanceToStore, formatNearDistance } from "@/lib/near";
import type { Point } from "@/lib/utils/route";

/** Магазины, подходящие под поиск: сразу на витрину */
export function FoundStores({ stores, near, t }: { stores: FoundStore[]; near: Point | null; t: Dictionary }) {
  if (stores.length === 0) return null;
  return (
    <section aria-label={t.catalog.foundStoresLabel} className="mb-8">
      <h2 className="mb-3 text-sm font-medium text-stone-500">
        {t.catalog.foundStores(stores.length)}
      </h2>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {stores.map((store) => {
          const km = near ? distanceToStore(near, store) : null;
          return (
            <li key={store.id} className="w-72 shrink-0 sm:w-auto">
              <Link
                href={`/s/${store.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-stone-300 hover:shadow-sm"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-200">
                  <StoreAvatar store={store} sizes="48px" textClassName="text-lg" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-stone-900">{store.name}</span>
                  <span className="block truncate text-sm text-stone-500">
                    {km !== null ? `📍 ${formatNearDistance(km, t)}` : `${store.city}, ${store.address}`}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-rose-600" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
