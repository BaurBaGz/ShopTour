"use client";

import { useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import type { ProductWithRelations } from "@/lib/data/types";
import { formatProductCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export type CategoryGroup = {
  id: string;
  name: string;
  products: ProductWithRelations[];
};

type CategorySectionsProps = {
  groups: CategoryGroup[];
};

export function CategorySections({ groups }: CategorySectionsProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const allCollapsed = groups.every((group) => collapsed.has(group.id));
  const noneCollapsed = collapsed.size === 0;

  const toolbarButtonClass =
    "rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-stone-200 transition hover:bg-stone-50 hover:text-stone-900 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 1 && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => setCollapsed(new Set(groups.map((g) => g.id)))}
            disabled={allCollapsed}
          >
            Свернуть все
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => setCollapsed(new Set())}
            disabled={noneCollapsed}
          >
            Развернуть все
          </button>
        </div>
      )}

      {groups.map((group) => {
        const isOpen = !collapsed.has(group.id);
        const panelId = `category-panel-${group.id}`;

        return (
          <section
            key={group.id}
            className="rounded-2xl border border-stone-200/80 bg-white"
          >
            <h2>
              <button
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left transition hover:bg-stone-50 sm:px-6"
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold text-stone-900">
                    {group.name}
                  </span>
                  <span className="text-sm text-stone-500">
                    {formatProductCount(group.products.length)}
                  </span>
                </span>
                <svg
                  className={cn(
                    "h-5 w-5 shrink-0 text-stone-400 transition-transform",
                    isOpen && "rotate-180",
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </h2>

            {isOpen && (
              <div
                id={panelId}
                className="grid grid-cols-2 gap-4 px-4 pb-6 sm:gap-6 sm:px-6 lg:grid-cols-3 xl:grid-cols-4"
              >
                {group.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
