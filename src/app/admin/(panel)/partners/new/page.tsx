import Link from "next/link";
import { createPartnerAction } from "@/app/admin/(panel)/partners/actions";
import { PartnerForm } from "@/components/admin/partner-form";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminNewPartnerPage() {
  await requireStaff();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/admin/partners" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        ← Все партнёры
      </Link>
      <p className="text-stone-500">
        Партнёр создаётся черновиком — покупатели его не увидят, пока вы не опубликуете. Точку на карте и владельца
        можно задать на следующем шаге.
      </p>
      <PartnerForm action={createPartnerAction} submitLabel="Создать черновик" allowLogoUrl />
    </div>
  );
}
