"use client";

import { useT } from "@/lib/i18n/client";
import { useActionState } from "react";
import type { PartnerFormState } from "@/app/admin/(panel)/partners/actions";
import { ImagesInput } from "@/components/admin/images-input";
import type { Store } from "@/lib/data/types";
import { submitKeepingValues } from "@/lib/form-submit";

type PartnerFormProps = {
  action: (prev: PartnerFormState, formData: FormData) => Promise<PartnerFormState>;
  store?: Pick<Store, "name" | "description" | "city" | "address" | "phone" | "whatsapp" | "instagram" | "logo_url">;
  submitLabel: string;
  /** id существующего партнёра — чтобы грузить логотип в его папку */
  storeId?: string;
  /** Админка: логотип можно вставить ссылкой. В кабинете магазина — только загрузка файла */
  allowLogoUrl?: boolean;
};

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const label = "mb-1.5 block text-sm font-medium text-stone-700";

export function PartnerForm({ action, store, submitLabel, storeId, allowLogoUrl = false }: PartnerFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const cabinet = useT().cabinet;
  const c = cabinet.storeForm;

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-stone-900">{c.info}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="p-name" className={label}>{c.name}</label>
          <input id="p-name" name="name" required defaultValue={store?.name} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="p-description" className={label}>{c.description}</label>
          <textarea id="p-description" name="description" rows={3} defaultValue={store?.description ?? ""} className={field} placeholder={c.descriptionPlaceholder} />
        </div>
        <div>
          <label htmlFor="p-city" className={label}>{c.city}</label>
          <input id="p-city" name="city" defaultValue={store?.city ?? c.defaultCity} className={field} />
        </div>
        <div>
          <label htmlFor="p-address" className={label}>{c.address}</label>
          <input id="p-address" name="address" required defaultValue={store?.address} className={field} placeholder={c.addressPlaceholder} />
        </div>
        <div>
          <label htmlFor="p-phone" className={label}>{c.phone}</label>
          <input id="p-phone" name="phone" type="tel" defaultValue={store?.phone ?? ""} className={field} placeholder="+7 727 000 00 00" />
        </div>
        <div>
          <label htmlFor="p-whatsapp" className={label}>WhatsApp</label>
          <input id="p-whatsapp" name="whatsapp" type="tel" defaultValue={store?.whatsapp ?? ""} className={field} placeholder="+7 701 000 00 00" />
        </div>
        <div>
          <label htmlFor="p-instagram" className={label}>Instagram</label>
          <input id="p-instagram" name="instagram" defaultValue={store?.instagram ?? ""} className={field} placeholder="@shop_almaty" />
        </div>
        <div className="sm:col-span-2">
          <ImagesInput
            name="logo_url"
            label={cabinet.images.logo}
            max={1}
            kind="stores"
            storeId={storeId ?? null}
            defaultValue={store?.logo_url ? [store.logo_url] : []}
            allowUrl={allowLogoUrl}
          />
          {!storeId && allowLogoUrl && <p className="mt-1 text-xs text-stone-500">{c.logoAfterCreate}</p>}
        </div>
      </div>
      {state.error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      {state.success && (
        <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
      >
        {pending ? c.saving : submitLabel}
      </button>
    </form>
  );
}
