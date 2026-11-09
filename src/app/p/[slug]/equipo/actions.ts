"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/database.types";

export type InviteState = { error?: string; link?: string; email?: string };

function readRoles(formData: FormData): MemberRole[] {
  const allowed: MemberRole[] = ["vendedor", "produccion", "admin"];
  return formData.getAll("roles").map(String).filter((r): r is MemberRole => allowed.includes(r as MemberRole));
}

export async function inviteMember(_: InviteState, formData: FormData): Promise<InviteState> {
  const bakeryId = String(formData.get("bakery_id"));
  const slug = String(formData.get("slug"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roles = readRoles(formData);
  if (roles.length === 0) return { error: "Elige al menos un rol." };

  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("create_invitation", {
    p_bakery_id: bakeryId,
    p_email: email,
    p_roles: roles,
  });
  if (error) return { error: error.message };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  revalidatePath(`/p/${slug}/equipo`);
  return { link: `${origin}/invitacion/${token}`, email };
}

export async function cancelInvitation(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", String(formData.get("id")));
  revalidatePath(`/p/${formData.get("slug")}/equipo`);
}

export async function updateMember(_: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member", {
    p_bakery_id: String(formData.get("bakery_id")),
    p_user_id: String(formData.get("user_id")),
    p_roles: readRoles(formData),
    p_active: formData.get("active") === "on",
  });
  revalidatePath(`/p/${formData.get("slug")}/equipo`);
  return { error: error?.message };
}

export async function removeMember(formData: FormData) {
  const supabase = await createClient();
  await supabase.rpc("remove_member", {
    p_bakery_id: String(formData.get("bakery_id")),
    p_user_id: String(formData.get("user_id")),
  });
  revalidatePath(`/p/${formData.get("slug")}/equipo`);
}
