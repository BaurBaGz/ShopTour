import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { STAFF_ROLE_LABELS, requireStaff } from "@/lib/auth/staff";

export default async function AdminAccountPage() {
  const staff = await requireStaff();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900">Профиль</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-stone-500">Email</dt>
            <dd className="font-medium text-stone-900">{staff.email}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Роль</dt>
            <dd className="font-medium text-stone-900">{STAFF_ROLE_LABELS[staff.role]}</dd>
          </div>
        </dl>
      </section>
      <ChangePasswordForm />
    </div>
  );
}
