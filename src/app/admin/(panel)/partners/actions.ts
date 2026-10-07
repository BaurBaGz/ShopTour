"use server";

import { storePhone } from "@/lib/utils/phone";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EMAIL_RE, findOrCreateUser } from "@/lib/auth/accounts";
import { getStaffForAction } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { createClient } from "@/lib/supabase/server";
import type { StoreStatus } from "@/types/database";

export type PartnerFormState = { error?: string; success?: string };
export type OwnerState = {
  error?: string;
  success?: string;
  created?: { email: string; password: string };
};

const STATUSES: StoreStatus[] = ["draft", "published", "hidden"];

function readInfo(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    name: text("name"),
    description: text("description") || null,
    city: text("city") || "Алматы",
    address: text("address"),
    phone: storePhone(text("phone").slice(0, 30)),
    whatsapp: storePhone(text("whatsapp").slice(0, 30)),
    instagram: text("instagram") || null,
    logo_url: text("logo_url") || null,
  };
}

function revalidatePartner(id?: string) {
  revalidatePath("/admin", "layout");
  revalidatePath("/catalog");
  revalidatePath("/stores");
  if (id) revalidatePath(`/stores/${id}`);
}

export async function createPartnerAction(
  _prev: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const info = readInfo(formData);
  if (!info.name || !info.address) return { error: "Заполните название и адрес" };

  const supabase = await createClient();
  // Новый партнёр — черновик: на сайт попадёт, когда его опубликуют
  const { data, error: insertError } = await supabase
    .from("stores")
    .insert({ ...info, status: "draft" })
    .select("id")
    .single();
  if (insertError || !data) return { error: insertError?.message ?? "Не удалось создать" };

  revalidatePartner();
  redirect(`/admin/partners/${data.id}?created=1`);
}

export async function updatePartnerAction(
  id: string,
  _prev: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный партнёр" };
  const info = readInfo(formData);
  if (!info.name || !info.address) return { error: "Заполните название и адрес" };

  const supabase = await createClient();
  const { error: updateError } = await supabase.from("stores").update(info).eq("id", id);
  if (updateError) return { error: updateError.message };
  revalidatePartner(id);
  return { success: "Сохранено" };
}

export async function updatePartnerStatusAction(id: string, status: StoreStatus) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id) || !STATUSES.includes(status)) return { error: "Неверные данные" };

  const supabase = await createClient();
  const { error: updateError } = await supabase.from("stores").update({ status }).eq("id", id);
  if (updateError) return { error: updateError.message };
  revalidatePartner(id);
  return { error: null };
}

export async function updatePartnerLocationAction(
  id: string,
  latitude: number | null,
  longitude: number | null,
) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный партнёр" };
  const valid = (v: number | null, min: number, max: number) =>
    v === null || (Number.isFinite(v) && v >= min && v <= max);
  if (
    !valid(latitude, -90, 90) ||
    !valid(longitude, -180, 180) ||
    (latitude === null) !== (longitude === null)
  ) {
    return { error: "Неверные координаты" };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("stores")
    .update({ latitude, longitude })
    .eq("id", id);
  if (updateError) return { error: updateError.message };
  revalidatePartner(id);
  return { error: null };
}

export async function assignOwnerAction(
  id: string,
  _prev: OwnerState,
  formData: FormData,
): Promise<OwnerState> {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный партнёр" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Проверьте email" };

  try {
    const supabase = await createClient();
    const { userId, temporaryPassword } = await findOrCreateUser(email);
    // Кабинет магазина рассчитан на один магазин на владельца
    const { data: other } = await supabase
      .from("stores")
      .select("id, name")
      .eq("owner_id", userId)
      .neq("id", id)
      .maybeSingle();
    if (other) return { error: `У этого аккаунта уже есть магазин «${other.name}»` };

    const { error: updateError } = await supabase
      .from("stores")
      .update({ owner_id: userId })
      .eq("id", id);
    if (updateError) return { error: updateError.message };
    revalidatePartner(id);
    return temporaryPassword
      ? { created: { email, password: temporaryPassword } }
      : { success: `Владелец ${email} привязан — входит со своим паролем` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось привязать владельца" };
  }
}

export async function removeOwnerAction(id: string) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный партнёр" };
  const supabase = await createClient();
  const { error: updateError } = await supabase.from("stores").update({ owner_id: null }).eq("id", id);
  if (updateError) return { error: updateError.message };
  revalidatePartner(id);
  return { error: null };
}

export async function deletePartnerAction(id: string) {
  const { staff, error } = await getStaffForAction({ admin: true });
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный партнёр" };
  const supabase = await createClient();
  // Товары удаляются вместе с магазином (on delete cascade)
  const { data, error: deleteError } = await supabase.from("stores").delete().eq("id", id).select("id");
  if (deleteError) return { error: deleteError.message };
  if (!data?.length) return { error: "Не удалось удалить — нет прав" };
  revalidatePartner();
  redirect("/admin/partners?deleted=1");
}
