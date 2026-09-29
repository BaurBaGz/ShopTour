import Link from "next/link";
import { getAdminOverview } from "@/lib/data/admin";
import { requireStaff } from "@/lib/auth/staff";

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export default async function AdminHomePage() {
  const staff = await requireStaff();
  const overview = await getAdminOverview();
  const { stores, products } = overview;

  const cards = [
    { label: "Партнёры", value: stores.total, note: `+${stores.newThisWeek} за неделю` },
    { label: "Товары", value: products.total, note: `+${products.newThisWeek} за неделю` },
    { label: "Со скидкой", value: products.discounted, note: "товаров" },
    { label: "Категории", value: overview.categories, note: `сотрудников: ${overview.staff}` },
  ];

  // Что требует внимания — показываем только ненулевое
  const attention = [
    {
      count: products.withoutPhoto,
      text: `${plural(products.withoutPhoto, "товар", "товара", "товаров")} без фото`,
      hint: "Карточка без фото почти не получает кликов",
    },
    {
      count: products.soldOut,
      text: `${plural(products.soldOut, "товар", "товара", "товаров")} нет в наличии`,
      hint: "Все размеры закончились или товар снят с продажи",
    },
    {
      count: stores.withoutLocation,
      text: `${plural(stores.withoutLocation, "партнёр", "партнёра", "партнёров")} без точки на карте`,
      hint: "Их не видно на странице карты и в маршрутах",
      href: "/admin/partners?filter=no-location",
    },
    {
      count: stores.withoutOwner,
      text: `${plural(stores.withoutOwner, "партнёр", "партнёра", "партнёров")} без владельца`,
      hint: "Магазин не может сам обновлять товары — только через админку",
      href: "/admin/partners?filter=no-owner",
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <p className="text-stone-500">
        Добро пожаловать{staff.name ? `, ${staff.name}` : ""}. Сводка по каталогу ShopTour.
      </p>

      <section aria-label="Сводка" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-sm text-stone-500">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-stone-900">{card.value}</p>
            <p className="mt-1 text-xs text-stone-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Требует внимания</h2>
        {attention.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Всё в порядке — замечаний нет.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {attention.map((item) => (
              <li key={item.text} className="flex items-start gap-4 py-3">
                <span className="min-w-12 rounded-lg bg-amber-50 px-2 py-1 text-center text-sm font-semibold tabular-nums text-amber-800">
                  {item.count}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{item.text}</p>
                  <p className="text-sm text-stone-500">{item.hint}</p>
                </div>
                {"href" in item && item.href && (
                  <Link href={item.href} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-rose-700 hover:text-rose-800">
                    Открыть →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-stone-500">
          Товары без фото и без наличия — в разделе «Товары» (следующий этап).
        </p>
      </section>
    </div>
  );
}
