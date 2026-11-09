"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../(auth)/actions";

export async function createBakery(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (name.length < 2) return { error: "Escribe el nombre de la pastelería." };

  const supabase = await createClient();
  // Toda la validación importante (dirección única, una pastelería por cuenta) la hace la base de datos.
  const { data, error } = await supabase.rpc("create_bakery", { p_name: name, p_slug: slug });
  if (error) return { error: error.message };
  redirect(`/p/${data.slug}`);
}

export async function checkSlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("check_slug_available", { p_slug: slug });
  return Boolean(data);
}
