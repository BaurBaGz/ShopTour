import Link from "next/link";
import { saveBannerAction } from "@/app/admin/(panel)/banners/actions";
import { BannerEditor } from "@/components/admin/banner-editor";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminNewBannerPage() {
  const staff = await requireStaff();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link href="/admin/banners" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">← Все баннеры</Link>
      <BannerEditor action={saveBannerAction.bind(null, null)} canDelete={staff.role === "admin"} submitLabel="Создать баннер" />
    </div>
  );
}
