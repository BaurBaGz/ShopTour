import { PromotionsPanel } from "@/components/promotions/promotions-panel";
import { requireCabinetPage } from "@/lib/auth/session";
import { getStorePromotions } from "@/lib/data/promotions";

export default async function DashboardPromotionsPage() {
  const { store } = await requireCabinetPage({ permission: "promotions" });
  const promotions = await getStorePromotions(store.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PromotionsPanel promotions={promotions} canAdd />
    </div>
  );
}
