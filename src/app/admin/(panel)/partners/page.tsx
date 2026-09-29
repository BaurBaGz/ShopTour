import Link from "next/link";
import { PartnersTable, type PartnerFilter } from "@/components/admin/partners-table";
import { requireStaff } from "@/lib/auth/staff";
import { getPartners } from "@/lib/data/admin-partners";

const FILTER_IDS: PartnerFilter[] = ["all", "published", "draft", "hidden", "no-location", "no-owner"];

type PageProps = { searchParams: Promise<{ filter?: string; deleted?: string }> };

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  await requireStaff();
  const { filter, deleted } = await searchParams;
  const partners = await getPartners();
  const initialFilter = FILTER_IDS.find((f) => f === filter) ?? "all";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-stone-500">Магазины на ShopTour: контакты, статус, владелец, точка на карте и товары.</p>
        <Link
          href="/admin/partners/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          + Добавить партнёра
        </Link>
      </div>
      {deleted && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Партнёр удалён вместе с его товарами.
        </p>
      )}
      <PartnersTable rows={partners} initialFilter={initialFilter} />
    </div>
  );
}
