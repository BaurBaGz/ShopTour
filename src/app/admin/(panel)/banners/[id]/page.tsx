import Link from "next/link";
import { notFound } from "next/navigation";
import { saveBannerAction } from "@/app/admin/(panel)/banners/actions";
import { BannerEditor } from "@/components/admin/banner-editor";
import { requireStaff } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

export default async function AdminBannerPage({ params, searchParams }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const { created } = await searchParams;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data: banner } = await supabase
    .from("banners")
    .select("id, kind, title, accent, body, cta_label, cta_href, image_url, theme, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!banner) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link href="/admin/banners" className="-mx-2 inline-flex min-h-11 items-center self-start px-2 text-sm font-medium text-stone-500 hover:text-stone-900">← Все баннеры</Link>
      {created && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Баннер создан.</p>}
      <BannerEditor action={saveBannerAction.bind(null, banner.id)} banner={banner} canDelete={staff.role === "admin"} submitLabel="Сохранить" />
    </div>
  );
}
