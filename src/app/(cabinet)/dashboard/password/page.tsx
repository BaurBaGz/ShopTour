import { getT } from "@/lib/i18n/server";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireCabinetPage } from "@/lib/auth/session";

export default async function DashboardAccountPage() {
  const { user, store, role } = await requireCabinetPage();
  const c = (await getT()).cabinet;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">{c.account.profile}</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-stone-500">Email</dt>
            <dd className="font-medium text-stone-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-stone-500">{c.account.store}</dt>
            <dd className="font-medium text-stone-900">{store.name}</dd>
          </div>
          <div>
            <dt className="text-stone-500">{c.account.role}</dt>
            <dd className="font-medium text-stone-900">{c.roles[role]}</dd>
          </div>
        </dl>
      </section>
      <ChangePasswordForm />
    </div>
  );
}
