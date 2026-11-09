"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../../(auth)/actions";

const HEX = /^#[0-9a-fA-F]{6}$/;

export async function saveBrand(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const primary = String(formData.get("primary_color"));
  const secondary = String(formData.get("secondary_color"));
  if (name.length < 2 || !HEX.test(primary) || !HEX.test(secondary)) return { error: "Revisa los datos." };

  const supabase = await createClient();
  // RLS solo deja editar al dueño; si no lo es, no se actualiza ninguna fila.
  const { data, error } = await supabase
    .from("bakeries")
    .update({ name, primary_color: primary, secondary_color: secondary })
    .eq("id", String(formData.get("bakery_id")))
    .select("id");
  if (error || !data?.length) return { error: "No se pudo guardar. ¿La suscripción está vigente?" };

  revalidatePath(`/p/${formData.get("slug")}`, "layout");
  return { message: "Guardado." };
}
