import Link from "next/link";
import type { Category } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

type CategoryFilterProps = {
  categories: Category[];
  activeCategoryId?: string;
  searchQuery?: string;
};

function buildHref(categoryId?: string, searchQuery?: string) {
  const params = new URLSearchParams();
  if (categoryId) params.set("category", categoryId);
  if (searchQuery?.trim()) params.set("q", searchQuery.trim());
  const qs = params.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

export function CategoryFilter({
  categories,
  activeCategoryId,
  searchQuery,
}: CategoryFilterProps) {
  const pillClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
      active
        ? "bg-stone-900 text-white shadow-sm"
        : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50 hover:text-stone-900",
    );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <Link
        href={buildHref(undefined, searchQuery)}
        className={pillClass(!activeCategoryId)}
      >
        Все
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildHref(category.id, searchQuery)}
          className={pillClass(activeCategoryId === category.id)}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
