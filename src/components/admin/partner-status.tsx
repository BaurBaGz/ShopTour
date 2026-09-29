import { cn } from "@/lib/utils/cn";
import type { StoreStatus } from "@/types/database";

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  published: "Опубликован",
  draft: "Черновик",
  hidden: "Скрыт",
};

export const STORE_STATUS_HINTS: Record<StoreStatus, string> = {
  published: "Виден покупателям в каталоге и на карте",
  draft: "Заполняется — покупатели его не видят",
  hidden: "Временно снят с сайта вместе с товарами",
};

export function PartnerStatusBadge({ status }: { status: StoreStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "published" && "bg-emerald-50 text-emerald-800",
        status === "draft" && "bg-amber-50 text-amber-800",
        status === "hidden" && "bg-stone-100 text-stone-600",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "published" && "bg-emerald-600",
          status === "draft" && "bg-amber-600",
          status === "hidden" && "bg-stone-500",
        )}
        aria-hidden
      />
      {STORE_STATUS_LABELS[status]}
    </span>
  );
}
