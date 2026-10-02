// Роли и доступы сотрудников магазина. Без серверных импортов — используется и в браузере.
// Те же названия доступов проверяет база (функция has_store_permission).

export const PERMISSIONS = ["reservations", "products", "products_delete", "promotions", "analytics", "store", "staff"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, { label: string; hint: string }> = {
  reservations: { label: "Брони", hint: "видеть брони и отвечать на них" },
  products: { label: "Товары", hint: "добавлять и менять товары, остатки, скидки, черновик" },
  products_delete: { label: "Удаление товаров", hint: "удалять товар насовсем" },
  promotions: { label: "Акции", hint: "создавать и снимать акции" },
  analytics: { label: "Статистика", hint: "раздел «Статистика»" },
  store: { label: "Профиль магазина", hint: "название, контакты, точка на карте, адрес витрины, Telegram" },
  staff: { label: "Сотрудники", hint: "добавлять людей, менять роли и доступы, отключать" },
};

export const MEMBER_ROLES = ["admin", "marketing", "seller"] as const;
/** Роль сотрудника; владелец — не сотрудник, он один и хранится в самом магазине */
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type CabinetRole = "owner" | MemberRole;

export const ROLE_LABELS: Record<CabinetRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  marketing: "Маркетинг",
  seller: "Продавец",
};

/** Шаблоны: какие доступы проставляются при выборе роли (потом их можно менять у каждого сотрудника) */
export const ROLE_TEMPLATES: Record<MemberRole, Permission[]> = {
  admin: [...PERMISSIONS],
  marketing: ["products", "promotions", "analytics", "store"],
  seller: ["reservations", "products", "promotions"],
};

export function isMemberRole(value: unknown): value is MemberRole {
  return MEMBER_ROLES.includes(value as MemberRole);
}

/** Только известные доступы, без повторов, в порядке списка */
export function cleanPermissions(values: unknown[]): Permission[] {
  return PERMISSIONS.filter((p) => values.includes(p));
}
