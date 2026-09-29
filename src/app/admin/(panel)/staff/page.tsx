import { StaffManager } from "@/components/admin/staff-manager";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStaffPage() {
  const me = await requireStaff({ admin: true });
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("user_id, email, name, role, must_change_password, created_at")
    .order("created_at");

  return (
    <div className="mx-auto max-w-5xl">
      <StaffManager rows={data ?? []} currentUserId={me.user_id} />
    </div>
  );
}
