"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../(auth)/actions";

export async function acceptInvitation(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: slug, error } = await supabase.rpc("accept_invitation", { p_token: String(formData.get("token")) });
  if (error) return { error: error.message };
  redirect(`/p/${slug}`);
}
