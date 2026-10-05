import { CategoriesManager } from "@/components/admin/categories-manager";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const staff = await requireStaff();
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, name_kk, name_en").order("sort_order").order("name"),
    supabase.from("products").select("category_id"),
  ]);
  const counts = new Map<string, number>();
  for (const p of products ?? []) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  return (
    <div className="mx-auto max-w-3xl">
      <CategoriesManager
        rows={(categories ?? []).map((c) => ({ id: c.id, name: c.name, nameKk: c.name_kk ?? "", nameEn: c.name_en ?? "", productCount: counts.get(c.id) ?? 0 }))}
        canDelete={staff.role === "admin"}
      />
    </div>
  );
}
