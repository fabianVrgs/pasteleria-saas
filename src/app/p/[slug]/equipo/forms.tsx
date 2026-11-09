"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Card, Input, Label, SubmitButton } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/roles";
import type { MemberRole } from "@/lib/database.types";
import { inviteMember, updateMember } from "./actions";

function RoleChecks({ allowAdmin, defaults = [] }: { allowAdmin: boolean; defaults?: MemberRole[] }) {
  const roles: MemberRole[] = allowAdmin ? ["vendedor", "produccion", "admin"] : ["vendedor", "produccion"];
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => (
        <label key={r} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm has-checked:border-brand has-checked:bg-brand/5">
          <input type="checkbox" name="roles" value={r} defaultChecked={defaults.includes(r)} className="accent-brand" />
          {ROLE_LABELS[r]}
        </label>
      ))}
    </div>
  );
}

export function ShareLink({ link, email, bakeryName }: { link: string; email: string; bakeryName: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Hola, te invito a unirte al equipo de ${bakeryName}. Crea tu cuenta con el correo ${email} en este enlace: ${link}`;
  return (
    <div className="flex flex-wrap gap-2">
      <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
        className="inline-flex min-h-11 items-center rounded-xl bg-[#25D366] px-4 font-semibold text-white">
        Enviar por WhatsApp
      </a>
      <Button variant="secondary" type="button" onClick={async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
      }}>
        {copied ? "¡Copiado!" : "Copiar enlace"}
      </Button>
    </div>
  );
}

export function InviteForm({ bakeryId, slug, bakeryName, allowAdmin, disabled }: {
  bakeryId: string; slug: string; bakeryName: string; allowAdmin: boolean; disabled: boolean;
}) {
  const [state, action] = useActionState(inviteMember, {});
  return (
    <Card>
      <h2 className="mb-1 text-lg font-bold">Invitar a alguien</h2>
      <p className="mb-4 text-sm text-muted">
        Se genera un enlace que puedes enviar por WhatsApp. La persona crea su cuenta con ese correo y queda en tu equipo.
      </p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bakery_id" value={bakeryId} />
        <input type="hidden" name="slug" value={slug} />
        <div>
          <Label htmlFor="email">Correo de la persona</Label>
          <Input id="email" name="email" type="email" required disabled={disabled} />
        </div>
        <div>
          <Label>¿Qué va a hacer?</Label>
          <RoleChecks allowAdmin={allowAdmin} />
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        {state.link && (
          <div className="space-y-3">
            <Alert tone="ok">Invitación lista para {state.email}. Envíale el enlace:</Alert>
            <ShareLink link={state.link} email={state.email!} bakeryName={bakeryName} />
          </div>
        )}
        <SubmitButton pendingText="Creando…" disabled={disabled}>Crear invitación</SubmitButton>
      </form>
    </Card>
  );
}

export function MemberEditor({ bakeryId, slug, userId, roles, active, allowAdmin }: {
  bakeryId: string; slug: string; userId: string; roles: MemberRole[]; active: boolean; allowAdmin: boolean;
}) {
  const [state, action] = useActionState(updateMember, {});
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="bakery_id" value={bakeryId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="user_id" value={userId} />
      <RoleChecks allowAdmin={allowAdmin} defaults={roles} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={active} className="accent-brand" /> Puede ingresar
      </label>
      {state.error && <Alert>{state.error}</Alert>}
      <SubmitButton variant="secondary">Guardar cambios</SubmitButton>
    </form>
  );
}
