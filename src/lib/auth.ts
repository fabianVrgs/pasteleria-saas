import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Bakery, MemberRole } from "@/lib/database.types";
import { hasRole } from "@/lib/roles";

/**
 * Capa de acceso a datos (DAL): todas las páginas preguntan "¿quién es el usuario?"
 * por aquí. `cache` evita repetir la consulta dentro de una misma petición.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
});

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/ingresar?next=${encodeURIComponent(next)}` : "/ingresar");
  return user;
}

export const isPlatformAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
});

export type BakeryContext = {
  bakery: Bakery;
  roles: MemberRole[];
  userId: string;
};

/**
 * Carga la pastelería por su dirección (slug) y los roles del usuario en ella.
 * Si el usuario no pertenece a esa pastelería, RLS no devuelve nada → 404.
 */
export const getBakeryContext = cache(async (slug: string): Promise<BakeryContext> => {
  const user = await requireUser(`/p/${slug}`);
  const supabase = await createClient();

  const { data: bakery } = await supabase.from("bakeries").select("*").eq("slug", slug).maybeSingle();
  if (!bakery) notFound();

  const { data: member } = await supabase
    .from("bakery_members")
    .select("roles, active")
    .eq("bakery_id", bakery.id)
    .eq("user_id", user.id)
    .maybeSingle();

  // El super-admin puede ver la pastelería aunque no sea miembro (para dar soporte).
  if (!member?.active && !(await isPlatformAdmin())) notFound();

  return { bakery, roles: member?.active ? member.roles : [], userId: user.id };
});

export async function requireBakeryRole(slug: string, ...allowed: MemberRole[]) {
  const ctx = await getBakeryContext(slug);
  if (!hasRole(ctx.roles, ...allowed)) redirect(`/p/${slug}`);
  return ctx;
}

/** Convierte "a/b" en una ruta interna segura (evita redirecciones a otros sitios). */
export function safeNext(next: FormDataEntryValue | string | null | undefined, fallback = "/inicio") {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
