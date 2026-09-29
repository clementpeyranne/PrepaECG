"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdminEstablishment,
  createAdminTeacherInvitation,
  purgeAdminSecurityData,
  revokeAdminTeacherInvitation,
  rotateAdminAccessCode,
  setAdminUserActive
} from "@/lib/admin";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function setUserActiveAction(formData: FormData) {
  await setAdminUserActive(value(formData, "userId"), value(formData, "isActive") === "true");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/activity");
}

export async function createEstablishmentAction(formData: FormData) {
  const result = await createAdminEstablishment({
    name: value(formData, "name"),
    yearLabel: value(formData, "yearLabel"),
    track: value(formData, "track"),
    accessCode: value(formData, "accessCode")
  });
  revalidatePath("/admin");
  revalidatePath("/admin/establishments");
  redirect(`/admin/establishments?status=${result.ok ? "success" : "error"}&message=${encodeURIComponent(result.message)}`);
}

export async function rotateAccessCodeAction(formData: FormData) {
  await rotateAdminAccessCode(value(formData, "classId"));
  revalidatePath("/admin/establishments");
}

export type InvitationActionState = { ok: boolean; message: string; link: string };

export async function createTeacherInvitationAction(
  _state: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const result = await createAdminTeacherInvitation({
    email: value(formData, "email"),
    classId: value(formData, "classId")
  });
  revalidatePath("/admin");
  revalidatePath("/admin/establishments");
  return result;
}

export async function revokeTeacherInvitationAction(formData: FormData) {
  await revokeAdminTeacherInvitation(value(formData, "invitationId"));
  revalidatePath("/admin");
  revalidatePath("/admin/establishments");
}

export async function purgeSecurityDataAction() {
  await purgeAdminSecurityData();
  revalidatePath("/admin/activity");
  revalidatePath("/admin/system");
}
