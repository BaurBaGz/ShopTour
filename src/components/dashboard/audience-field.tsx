import { AUDIENCE_OPTIONS } from "@/lib/audience";
import type { ProductAudience } from "@/types/database";

/** «Для кого» в форме товара: одно касание вместо списка */
export function AudienceField({ defaultValue }: { defaultValue?: ProductAudience | null }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-stone-700">Для кого *</legend>
      <div className="grid grid-cols-3 gap-2">
        {AUDIENCE_OPTIONS.map((option) => (
          <label
            key={option.id}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-2 text-center text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50 has-[:checked]:bg-stone-900 has-[:checked]:text-white has-[:checked]:ring-stone-900 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-rose-500/30"
          >
            <input
              type="radio"
              name="audience"
              value={option.id}
              required
              defaultChecked={defaultValue === option.id}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs text-stone-500">Унисекс увидят и в разделе «Женщинам», и в «Мужчинам»</p>
    </fieldset>
  );
}
