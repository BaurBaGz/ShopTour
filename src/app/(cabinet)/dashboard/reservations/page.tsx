import { ReservationsPanel, type DashboardReservation } from "@/components/dashboard/reservations-panel";
import { requireCabinetPage } from "@/lib/auth/session";
import { formatPhone, VISIT_LABELS } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/server";
import { telegramConfigured } from "@/lib/telegram";

export default async function DashboardReservationsPage() {
  const { store, role } = await requireCabinetPage();
  const supabase = await createClient();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [reservationsResult, notifyResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, product_name, size, price, customer_name, customer_phone, visit, comment, status, created_at")
      .eq("store_id", store.id)
      .gte("created_at", monthAgo)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("store_notifications").select("telegram_chat_id, telegram_name, daily_summary").eq("store_id", store.id).maybeSingle(),
  ]);

  // Сначала ждут ответа, затем отложенные, затем закрытые — новые выше
  const order = { new: 0, confirmed: 1, declined: 2, completed: 2, no_show: 2 } as const;
  type Row = Omit<DashboardReservation, "phone_label" | "visit_label"> & { visit: keyof typeof VISIT_LABELS };
  const reservations: DashboardReservation[] = ((reservationsResult.data ?? []) as Row[])
    .map((r) => ({ ...r, phone_label: formatPhone(r.customer_phone), visit_label: VISIT_LABELS[r.visit] }))
    .sort((a, b) => order[a.status] - order[b.status]);
  const telegram = {
    // Подключением Telegram управляет владелец
    configured: role === "owner" && telegramConfigured(),
    connectedAs: notifyResult.data?.telegram_chat_id ? (notifyResult.data.telegram_name ?? "подключено") : null,
    dailySummary: notifyResult.data?.daily_summary ?? true,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ReservationsPanel reservations={reservations} telegram={telegram} />
    </div>
  );
}
