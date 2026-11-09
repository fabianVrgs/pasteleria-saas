"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BakeryPlan, SubscriptionStatus } from "@/lib/database.types";
import { todayInBogota } from "@/lib/subscription";

function addMonths(isoDate: string, months: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Registrar un pago: activa la pastelería y extiende la fecha de vencimiento N meses. */
export async function registerPayment(formData: FormData) {
  const today = todayInBogota();
  const current = String(formData.get("paid_until") || "");
  const base = current && current > today ? current : today;
  const supabase = await createClient();
  await supabase.rpc("admin_update_subscription", {
    p_bakery_id: String(formData.get("bakery_id")),
    p_plan: String(formData.get("plan")) as BakeryPlan,
    p_status: "active",
    p_paid_until: addMonths(base, Number(formData.get("months") || 1)),
  });
  revalidatePath("/admin");
}

/** Edición manual completa (por ejemplo, suspender una cuenta). */
export async function setSubscription(formData: FormData) {
  const supabase = await createClient();
  await supabase.rpc("admin_update_subscription", {
    p_bakery_id: String(formData.get("bakery_id")),
    p_plan: String(formData.get("plan")) as BakeryPlan,
    p_status: String(formData.get("status")) as SubscriptionStatus,
    p_paid_until: String(formData.get("paid_until") || "") || (null as unknown as string),
  });
  revalidatePath("/admin");
}
