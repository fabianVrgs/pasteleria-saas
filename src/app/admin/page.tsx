import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin, requireUser } from "@/lib/auth";
import { accessState, formatDate } from "@/lib/subscription";
import { registerPayment, setSubscription } from "./actions";

export const metadata: Metadata = { title: "Super-administrador" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">🛠️ Pastelerías registradas</h1>
        <Link href="/inicio" className="text-sm font-semibold text-brand underline">Volver</Link>
      </div>
      <Suspense fallback={<p className="text-muted">Cargando…</p>}>
        <BakeriesTable />
      </Suspense>
    </main>
  );
}

const STATE_BADGE = {
  trial: "bg-brand-2/30 text-foreground",
  active: "bg-ok/10 text-ok",
  read_only: "bg-danger/10 text-danger",
} as const;

async function BakeriesTable() {
  await requireUser("/admin");
  // Doble protección: la página no se muestra y, además, la función de la base de datos rechaza a quien no es super-admin.
  if (!(await isPlatformAdmin())) notFound();

  const supabase = await createClient();
  const { data: bakeries, error } = await supabase.rpc("admin_list_bakeries");
  if (error) return <p className="text-danger">{error.message}</p>;
  if (!bakeries?.length) return <p className="text-muted">Aún no hay pastelerías.</p>;

  const counts = { trial: 0, active: 0, read_only: 0 };
  bakeries.forEach((b) => counts[accessState(b).kind]++);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="En prueba" value={counts.trial} />
        <Stat label="Pagando" value={counts.active} />
        <Stat label="Vencidas / suspendidas" value={counts.read_only} />
      </div>

      {bakeries.map((b) => {
        const state = accessState(b);
        return (
          <div key={b.id} className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{b.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATE_BADGE[state.kind]}`}>
                    {state.kind === "trial" ? `Prueba · ${state.daysLeft} d` : state.kind === "active" ? `Activa · ${b.plan}` : "Solo lectura"}
                  </span>
                </div>
                <div className="text-sm text-muted break-all">
                  /p/{b.slug} · {b.owner_email} · {b.members_count} personas
                </div>
                <div className="text-sm text-muted">
                  Creada {formatDate(b.created_at)} · Prueba hasta {formatDate(b.trial_ends_at)} · Pagado hasta {formatDate(b.paid_until)}
                </div>
              </div>
              <Link href={`/p/${b.slug}`} className="text-sm font-semibold text-brand underline">Ver</Link>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <form action={registerPayment} className="flex flex-wrap items-end gap-2 rounded-xl bg-background p-3">
                <input type="hidden" name="bakery_id" value={b.id} />
                <input type="hidden" name="paid_until" value={b.paid_until ?? ""} />
                <Field label="Plan">
                  <select name="plan" defaultValue={b.plan} className="rounded-lg border border-border px-2 py-2">
                    <option value="basico">Básico</option>
                    <option value="plus">Plus</option>
                  </select>
                </Field>
                <Field label="Meses">
                  <input name="months" type="number" min={1} max={24} defaultValue={1} className="w-20 rounded-lg border border-border px-2 py-2" />
                </Field>
                <button className="min-h-10 rounded-lg bg-ok px-3 font-semibold text-white">Registrar pago</button>
              </form>

              <details className="rounded-xl bg-background p-3">
                <summary className="cursor-pointer text-sm font-semibold">Edición manual</summary>
                <form action={setSubscription} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="bakery_id" value={b.id} />
                  <Field label="Plan">
                    <select name="plan" defaultValue={b.plan} className="rounded-lg border border-border px-2 py-2">
                      <option value="basico">Básico</option>
                      <option value="plus">Plus</option>
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select name="status" defaultValue={b.status} className="rounded-lg border border-border px-2 py-2">
                      <option value="trial">Prueba</option>
                      <option value="active">Activa</option>
                      <option value="suspended">Suspendida</option>
                    </select>
                  </Field>
                  <Field label="Pagado hasta">
                    <input name="paid_until" type="date" defaultValue={b.paid_until ?? ""} className="rounded-lg border border-border px-2 py-2" />
                  </Field>
                  <button className="min-h-10 rounded-lg border border-border bg-white px-3 font-semibold">Guardar</button>
                </form>
              </details>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  );
}
