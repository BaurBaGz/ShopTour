"use client";

import { useT } from "@/lib/i18n/client";
import { LISTINGS, type Listing } from "@/lib/rental";
import { cn } from "@/lib/utils/cn";

type RentalFieldsProps = {
  listing: Listing;
  onListingChange: (listing: Listing) => void;
  defaults?: { rent_price?: number | null; rent_terms?: string | null; rent_deposit?: string | null };
  inputClass: string;
  labelClass: string;
};

/** «Продаётся / Прокат / И то, и другое» и условия проката — в форме товара (кабинет и админка) */
export function RentalFields({ listing, onListingChange, defaults, inputClass, labelClass }: RentalFieldsProps) {
  const c = useT().cabinet.productForm;
  const labels: Record<Listing, string> = { sale: c.listingSale, rent: c.listingRent, both: c.listingBoth };

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className={labelClass}>{c.listingTitle}</legend>
      <input type="hidden" name="listing" value={listing} />
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={c.listingTitle}>
        {LISTINGS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={listing === id}
            onClick={() => onListingChange(id)}
            className={cn(
              "min-h-11 rounded-xl px-2 text-sm font-medium ring-1 transition",
              listing === id ? "bg-stone-900 text-white ring-stone-900" : "text-stone-700 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {labels[id]}
          </button>
        ))}
      </div>
      {listing === "both" && <p className="-mt-2 text-xs text-stone-500">{c.listingHint}</p>}

      {listing !== "sale" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rent-price" className={labelClass}>
              {c.rentPrice}
            </label>
            <input
              id="rent-price"
              name="rentPrice"
              type="number"
              inputMode="numeric"
              min={0}
              step={100}
              required
              defaultValue={defaults?.rent_price ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="rent-deposit" className={labelClass}>
              {c.rentDeposit}
            </label>
            <input
              id="rent-deposit"
              name="rentDeposit"
              maxLength={100}
              defaultValue={defaults?.rent_deposit ?? ""}
              placeholder={c.rentDepositPlaceholder}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-stone-500">{c.rentDepositHint}</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="rent-terms" className={labelClass}>
              {c.rentTerms}
            </label>
            <input
              id="rent-terms"
              name="rentTerms"
              maxLength={300}
              defaultValue={defaults?.rent_terms ?? ""}
              placeholder={c.rentTermsPlaceholder}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
