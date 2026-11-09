"use client";

import { useActionState, useState } from "react";
import { Alert, Card, Input, Label, SubmitButton } from "@/components/ui";
import { saveBrand } from "./actions";

export function BrandForm(props: { bakeryId: string; slug: string; name: string; primary: string; secondary: string }) {
  const [state, action] = useActionState(saveBrand, {});
  const [primary, setPrimary] = useState(props.primary);
  const [secondary, setSecondary] = useState(props.secondary);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="bakery_id" value={props.bakeryId} />
        <input type="hidden" name="slug" value={props.slug} />
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={props.name} required maxLength={80} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary">Color principal</Label>
            <input id="primary" name="primary_color" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
              className="h-12 w-full cursor-pointer rounded-xl border border-border" />
          </div>
          <div>
            <Label htmlFor="secondary">Color secundario</Label>
            <input id="secondary" name="secondary_color" type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)}
              className="h-12 w-full cursor-pointer rounded-xl border border-border" />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ background: secondary }}>🧁</span>
          <span className="rounded-lg px-3 py-2 font-semibold text-white" style={{ background: primary }}>Vista previa</span>
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        {state.message && <Alert tone="ok">{state.message}</Alert>}
        <SubmitButton>Guardar</SubmitButton>
      </form>
    </Card>
  );
}
