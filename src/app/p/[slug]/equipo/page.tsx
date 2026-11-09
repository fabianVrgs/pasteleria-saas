import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireBakeryRole } from "@/lib/auth";
import { rolesText } from "@/lib/roles";
import { accessState, formatDate } from "@/lib/subscription";
import { Card } from "@/components/ui";
import { InviteForm, MemberEditor, ShareLink } from "./forms";
import { cancelInvitation, removeMember } from "./actions";

export const metadata: Metadata = { title: "Equipo" };

export default function Page({ params }: PageProps<"/p/[slug]/equipo">) {
  return (
    <Suspense fallback={<p className="text-muted">Cargando equipo…</p>}>
      <Team params={params} />
    </Suspense>
  );
}

async function Team({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { bakery, roles, userId } = await requireBakeryRole(slug, "admin");
  const supabase = await createClient();

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase.from("bakery_members").select("user_id, roles, active").eq("bakery_id", bakery.id).order("created_at"),
    supabase.from("invitations").select("id, email, roles, token, expires_at").eq("bakery_id", bakery.id)
      .is("accepted_at", null).order("created_at", { ascending: false }),
  ]);
  const ids = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.full_name || "Sin nombre";

  const isOwner = roles.includes("owner");
  const allowAdmin = isOwner && bakery.plan === "plus";
  const readOnly = accessState(bakery).kind === "read_only";
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">Equipo</h1>
        {(members ?? []).map((m) => {
          const editable = !m.roles.includes("owner") && m.user_id !== userId && (isOwner || !m.roles.includes("admin"));
          return (
            <Card key={m.user_id} className={m.active ? "" : "opacity-60"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{nameOf(m.user_id)}{m.user_id === userId && " (tú)"}</div>
                  <div className="text-sm text-muted">{rolesText(m.roles)}{!m.active && " · Desactivado"}</div>
                </div>
                {editable && !readOnly && (
                  <form action={removeMember}>
                    <input type="hidden" name="bakery_id" value={bakery.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <button className="text-sm font-semibold text-danger underline">Quitar</button>
                  </form>
                )}
              </div>
              {editable && !readOnly && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-semibold text-brand">Cambiar roles</summary>
                  <MemberEditor bakeryId={bakery.id} slug={slug} userId={m.user_id} roles={m.roles} active={m.active} allowAdmin={allowAdmin} />
                </details>
              )}
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <InviteForm bakeryId={bakery.id} slug={slug} bakeryName={bakery.name} allowAdmin={allowAdmin} disabled={readOnly} />
        {(invitations ?? []).length > 0 && (
          <Card>
            <h2 className="mb-3 text-lg font-bold">Invitaciones pendientes</h2>
            <ul className="space-y-4">
              {invitations!.map((inv) => (
                <li key={inv.id} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold break-all">{inv.email}</div>
                      <div className="text-sm text-muted">{rolesText(inv.roles)} · vence {formatDate(inv.expires_at)}</div>
                    </div>
                    <form action={cancelInvitation}>
                      <input type="hidden" name="id" value={inv.id} />
                      <input type="hidden" name="slug" value={slug} />
                      <button className="text-sm font-semibold text-danger underline">Cancelar</button>
                    </form>
                  </div>
                  <ShareLink link={`${origin}/invitacion/${inv.token}`} email={inv.email} bakeryName={bakery.name} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
