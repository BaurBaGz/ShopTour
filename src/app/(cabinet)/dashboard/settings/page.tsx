import { getT } from "@/lib/i18n/server";
import { updateOwnLocationAction, updateOwnStoreAction } from "@/app/(cabinet)/dashboard/actions";
import { LocationPicker } from "@/components/admin/location-picker";
import { PartnerForm } from "@/components/admin/partner-form";
import { requireCabinetPage } from "@/lib/auth/session";

export default async function StoreSettingsPage() {
  const { store } = await requireCabinetPage({ permission: "store" });
  const c = (await getT()).cabinet.storeForm;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <p className="text-sm text-stone-500">
        {c.intro}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <PartnerForm action={updateOwnStoreAction} store={store} storeId={store.id} submitLabel={c.save} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          {store.latitude === null && (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {c.noLocation}
            </p>
          )}
          <LocationPicker
            storeId={store.id}
            latitude={store.latitude}
            longitude={store.longitude}
            address={`${store.city}, ${store.address}`}
            onSave={updateOwnLocationAction}
          />
        </div>
      </div>
    </div>
  );
}
