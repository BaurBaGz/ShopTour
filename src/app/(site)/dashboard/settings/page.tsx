import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { updateOwnLocationAction, updateOwnStoreAction } from "@/app/(site)/dashboard/actions";
import { LocationPicker } from "@/components/admin/location-picker";
import { PartnerForm } from "@/components/admin/partner-form";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Профиль магазина — ShopTour",
};

export default async function StoreSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard/settings");
  const store = await getStoreForOwner(user.id);
  if (!store) redirect("/account");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link href="/dashboard" className="-mx-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
          ← Кабинет
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">Профиль магазина</h1>
        <p className="mt-1 text-sm text-stone-500">
          Это видят покупатели на витрине, в каталоге и на карте. Телефон и WhatsApp нужны, чтобы с вами могли связаться.
        </p>
      </div>

      <PartnerForm action={updateOwnStoreAction} store={store} storeId={store.id} submitLabel="Сохранить" />

      {store.latitude === null && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Поставьте точку на карте — без неё магазина нет в «Рядом со мной» и в маршрутах покупателей.
        </p>
      )}
      <LocationPicker
        storeId={store.id}
        latitude={store.latitude}
        longitude={store.longitude}
        address={`${store.city}, ${store.address}`}
        onSave={updateOwnLocationAction}
      />
    </main>
  );
}
