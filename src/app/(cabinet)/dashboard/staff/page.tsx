import { SellersManager } from "@/components/dashboard/sellers-manager";
import { requireCabinetPage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardStaffPage() {
  const { user, store } = await requireCabinetPage({ ownerOnly: true });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .select("user_id, email, name, must_change_password, created_at")
    .eq("store_id", store.id)
    .order("created_at");
  if (error) console.error("[cabinet] store_members:", error.message);

  return (
    <div className="mx-auto max-w-4xl">
      <SellersManager owner={{ email: user.email ?? "" }} rows={data ?? []} />
    </div>
  );
}
