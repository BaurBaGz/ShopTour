import Link from "next/link";
import { BannersList } from "@/components/admin/banners-list";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

type PageProps = { searchParams: Promise<{ deleted?: string }> };

export default async function AdminBannersPage({ searchParams }: PageProps) {
  await requireStaff();
  const { deleted } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("banners")
    .select("id, kind, title, accent, body, cta_label, cta_href, image_url, theme, is_active")
    .order("sort_order")
    .order("created_at");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-stone-500">Карусель над каталогом: порядок, показ и тексты баннеров.</p>
        <Link href="/admin/banners/new" className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600">
          + Новый баннер
        </Link>
      </div>
      {deleted && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Баннер удалён.</p>}
      <BannersList rows={data ?? []} />
    </div>
  );
}
