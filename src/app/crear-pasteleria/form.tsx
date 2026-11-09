"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert, Card, Input, Label, SubmitButton } from "@/components/ui";
import { checkSlug, createBakery } from "./actions";

/** "Gelatortas Zaritha" → "gelatortas-zaritha" */
function toSlug(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function CreateBakeryForm() {
  const [state, action] = useActionState(createBakery, {});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const finalSlug = touched ? slug : toSlug(name);

  useEffect(() => {
    if (finalSlug.length < 3) return;
    let cancel = false;
    const t = setTimeout(async () => {
      const ok = await checkSlug(finalSlug);
      if (!cancel) setAvailable(ok);
    }, 400);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [finalSlug]);

  const showAvailability = finalSlug.length >= 3 ? available : null;

  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold">Crea tu pastelería</h1>
      <p className="mb-5 text-sm text-muted">Tendrás 15 días de prueba gratis con todas las funciones.</p>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre de la pastelería</Label>
          <Input id="name" name="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="slug">Dirección web</Label>
          <div className="flex items-center gap-1 text-sm text-muted">
            <span className="shrink-0">…/p/</span>
            <Input
              id="slug"
              name="slug"
              required
              value={finalSlug}
              onChange={(e) => {
                setTouched(true);
                setSlug(toSlug(e.target.value));
              }}
            />
          </div>
          {showAvailability === true && <p className="mt-1 text-sm text-ok">✓ Disponible</p>}
          {showAvailability === false && <p className="mt-1 text-sm text-danger">No disponible, prueba otra.</p>}
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        <SubmitButton className="w-full" pendingText="Creando…" disabled={showAvailability === false}>
          Crear pastelería
        </SubmitButton>
      </form>
    </Card>
  );
}
