import { TeamManager } from "@/components/dashboard/team-manager";
import { cleanPermissions, isMemberRole } from "@/lib/auth/permissions";
import { getUserEmails } from "@/lib/auth/accounts";
import { requireCabinetPage } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardStaffPage() {
  const { user, store, role } = await requireCabinetPage({ permission: "staff" });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .select("user_id, email, name, role, permissions, must_change_password, created_at")
    .eq("store_id", store.id)
    .order("created_at");
  if (error) console.error("[cabinet] store_members:", error.message);

  // Владельца показываем первой строкой; его email знает только сервер
  const ownerEmail =
    role === "owner" ? (user.email ?? "") : store.owner_id ? ((await getUserEmails([store.owner_id])).get(store.owner_id) ?? "") : "";

  const rows = (data ?? []).map((row) => ({
    ...row,
    role: isMemberRole(row.role) ? row.role : ("seller" as const),
    permissions: cleanPermissions(row.permissions ?? []),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <TeamManager owner={{ email: ownerEmail, isMe: role === "owner" }} rows={rows} currentUserId={user.id} />
    </div>
  );
}
