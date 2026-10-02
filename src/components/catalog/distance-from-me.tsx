"use client";

import { useSavedPlace } from "@/components/catalog/near-me";
import { useT } from "@/lib/i18n/client";
import { distanceToStore, formatNearDistance } from "@/lib/near";
import { cn } from "@/lib/utils/cn";

/** «📍 850 м · 12 мин пешком» от места, которое покупатель указал в «Рядом» */
export function DistanceFromMe({
  store,
  className,
}: {
  store: { latitude: number | null; longitude: number | null };
  className?: string;
}) {
  const place = useSavedPlace();
  const t = useT();
  const km = place ? distanceToStore(place, store) : null;
  if (km === null) return null;
  return (
    <p className={cn("text-sm font-medium text-rose-700", className)}>
      📍 {formatNearDistance(km, t)} {place?.place ? t.near.fromAddress(place.place) : t.near.fromYou}
    </p>
  );
}
