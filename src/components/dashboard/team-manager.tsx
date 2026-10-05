"use client";

import { useActionState, useState, useTransition } from "react";
import { addMemberAction, removeMemberAction, updateMemberAction, type AddMemberState } from "@/app/(cabinet)/dashboard/staff/actions";
import { MEMBER_ROLES, PERMISSIONS, ROLE_TEMPLATES, type MemberRole, type Permission } from "@/lib/auth/permissions";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils/cn";

type MemberRow = {
  user_id: string;
  email: string;
  name: string | null;
  role: MemberRole;
  permissions: Permission[];
  must_change_password: boolean;
  created_at: string;
};

const field =
  "min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-500/15";
const label = "mb-1.5 block text-sm font-medium text-stone-700";

/** Роль (шаблон) и галочки доступов: смена роли проставляет галочки по шаблону, дальше их можно менять */
function AccessEditor({
  idPrefix,
  role,
  permissions,
  onChange,
  inputName,
}: {
  idPrefix: string;
  role: MemberRole;
  permissions: Permission[];
  onChange: (role: MemberRole, permissions: Permission[]) => void;
  /** Имя полей для отправки обычной формой (форма добавления) */
  inputName?: boolean;
}) {
  const c = useT().cabinet;
  const toggle = (permission: Permission, checked: boolean) =>
    onChange(role, PERMISSIONS.filter((p) => (p === permission ? checked : permissions.includes(p))));

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div>
        <label htmlFor={`${idPrefix}-role`} className={label}>{c.team.role}</label>
        <select
          id={`${idPrefix}-role`}
          name={inputName ? "role" : undefined}
          value={role}
          onChange={(e) => {
            const next = e.target.value as MemberRole;
            onChange(next, ROLE_TEMPLATES[next]);
          }}
          className={field}
        >
          {MEMBER_ROLES.map((r) => (
            <option key={r} value={r}>{c.roles[r]}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-stone-500">{c.team.roleHint}</p>
      </div>
      <fieldset>
        <legend className={label}>{c.team.whatIsOpen}</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {PERMISSIONS.map((permission) => (
            <label key={permission} className="flex min-h-11 items-start gap-3 py-1.5">
              <input
                type="checkbox"
                name={inputName ? "permissions" : undefined}
                value={permission}
                checked={permissions.includes(permission)}
                onChange={(e) => toggle(permission, e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 accent-rose-600"
              />
              <span className="text-sm">
                <span className="font-medium text-stone-900">{c.permissions[permission].label}</span>
                <span className="block text-xs text-stone-500">{c.permissions[permission].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function MemberItem({ row, isMe }: { row: MemberRow; isMe: boolean }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(row.role);
  const [permissions, setPermissions] = useState(row.permissions);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const t = useT();
  const c = t.cabinet;
  const dateFormat = new Intl.DateTimeFormat(t.intl, { day: "numeric", month: "short", year: "numeric" });

  const save = () =>
    startTransition(async () => {
      const result = await updateMemberAction(row.user_id, role, permissions);
      setError(result.error);
      setSaved(!result.error);
    });
  const remove = () =>
    startTransition(async () => {
      const result = await removeMemberAction(row.user_id);
      setError(result.error);
      setConfirmRemove(false);
    });

  return (
    <li className={cn("px-5 py-3", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900">
            {row.name || row.email} {isMe && <span className="font-normal text-stone-500">{c.team.you}</span>}
          </p>
          <p className="truncate text-sm text-stone-500">
            {c.roles[row.role]}
            {row.name ? ` · ${row.email}` : ""} · {c.team.since(dateFormat.format(new Date(row.created_at)))}
          </p>
          <p className="text-xs text-stone-500">{row.permissions.map((p) => c.permissions[p].label).join(" · ")}</p>
          {row.must_change_password && <p className="text-xs text-amber-700">{c.team.tempPassword}</p>}
        </div>
        {!isMe && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="min-h-11 rounded-xl px-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
            >
              {open ? c.team.collapse : c.team.roleAndAccess}
            </button>
            {confirmRemove ? (
              <>
                <button type="button" onClick={remove} disabled={pending} className="min-h-11 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700">
                  {c.team.disable}
                </button>
                <button type="button" onClick={() => setConfirmRemove(false)} className="min-h-11 rounded-xl px-3 text-sm text-stone-600 hover:bg-stone-100">
                  {t.common.cancel}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(true)} className="min-h-11 rounded-xl px-3 text-sm font-medium text-red-700 hover:bg-red-50">
                {c.team.disableAccess}
              </button>
            )}
          </div>
        )}
      </div>

      {open && !isMe && (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4">
          <AccessEditor
            idPrefix={`member-${row.user_id}`}
            role={role}
            permissions={permissions}
            onChange={(nextRole, nextPermissions) => {
              setRole(nextRole);
              setPermissions(nextPermissions);
              setSaved(false);
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={pending} className="min-h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
              {pending ? c.team.saving : c.team.saveAccess}
            </button>
            {saved && <p role="status" className="text-sm text-emerald-700">{c.team.saved}</p>}
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}

type TeamManagerProps = {
  owner: { email: string; isMe: boolean };
  rows: MemberRow[];
  currentUserId: string;
};

/** Сотрудники магазина: владелец, роли и доступы каждого, добавление и отключение */
export function TeamManager({ owner, rows, currentUserId }: TeamManagerProps) {
  const [state, addAction, adding] = useActionState<AddMemberState, FormData>(addMemberAction, {});
  const [role, setRole] = useState<MemberRole>("seller");
  const [permissions, setPermissions] = useState<Permission[]>(ROLE_TEMPLATES.seller);
  const c = useT().cabinet.team;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">{c.title}</h2>
          <span className="text-sm text-stone-500">{rows.length + 1}</span>
        </div>
        <ul className="divide-y divide-stone-100">
          <li className="px-5 py-3">
            <p className="truncate font-medium text-stone-900">
              {owner.email || c.ownerFallback} {owner.isMe && <span className="font-normal text-stone-500">{c.you}</span>}
            </p>
            <p className="text-sm text-stone-500">{c.ownerNote}</p>
          </li>
          {rows.map((row) => (
            // key с доступами: после сохранения строка пересоздаётся с актуальными значениями
            <MemberItem key={`${row.user_id}:${row.role}:${row.permissions.join(",")}`} row={row} isMe={row.user_id === currentUserId} />
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">{c.addTitle}</h2>
        <p className="mt-1 text-sm text-stone-500">
          {c.addText}
        </p>
        <form action={addAction} className="mt-5 flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="member-email" className={label}>Email *</label>
              <input id="member-email" name="email" type="email" required autoComplete="off" placeholder="sotrudnik@example.com" className={field} />
            </div>
            <div>
              <label htmlFor="member-name" className={label}>{c.name}</label>
              <input id="member-name" name="name" maxLength={60} autoComplete="off" placeholder={c.namePlaceholder} className={field} />
            </div>
          </div>
          <AccessEditor
            idPrefix="new-member"
            role={role}
            permissions={permissions}
            onChange={(nextRole, nextPermissions) => {
              setRole(nextRole);
              setPermissions(nextPermissions);
            }}
            inputName
          />
          <button type="submit" disabled={adding} className="min-h-11 self-start rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60">
            {adding ? c.adding : c.add}
          </button>
        </form>

        {state.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</p>}
        {state.created && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">{c.createdTitle}</p>
            <p className="mt-2">
              Email: <span className="font-mono font-semibold">{state.created.email}</span>
            </p>
            <p>
              {c.tempPasswordLabel} <span className="font-mono font-semibold">{state.created.password}</span>
            </p>
            <p className="mt-2 text-emerald-800">{c.createdHint}</p>
          </div>
        )}
      </section>
    </div>
  );
}
