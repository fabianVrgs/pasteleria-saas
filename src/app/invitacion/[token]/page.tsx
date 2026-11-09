import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { rolesText } from "@/lib/roles";
import { Alert, Card } from "@/components/ui";
import { AcceptButton } from "./accept";

export const metadata: Metadata = { title: "Invitación" };

export default function Page({ params }: PageProps<"/invitacion/[token]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <Suspense fallback={<p className="text-muted">Cargando invitación…</p>}>
        <Invitation params={params} />
      </Suspense>
    </main>
  );
}

async function Invitation({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const [{ data }, user] = await Promise.all([supabase.rpc("get_invitation", { p_token: token }), getCurrentUser()]);
  const inv = data?.[0];

  if (!inv) return <Card><Alert>Esta invitación no existe.</Alert></Card>;
  if (inv.accepted) return <Card><Alert tone="info">Esta invitación ya fue usada. <Link className="underline" href="/inicio">Ir al inicio</Link></Alert></Card>;
  if (inv.expired) return <Card><Alert>La invitación venció. Pide una nueva a quien te invitó.</Alert></Card>;

  const next = encodeURIComponent(`/invitacion/${token}`);
  const sameEmail = user?.email.toLowerCase() === inv.email.toLowerCase();

  return (
    <Card>
      <div className="text-3xl">🧁</div>
      <h1 className="mt-2 text-xl font-bold">Te invitaron a {inv.bakery_name}</h1>
      <p className="mt-1 text-sm text-muted">Como: {rolesText(inv.roles)}</p>
      <p className="mt-1 text-sm text-muted break-all">Para el correo: {inv.email}</p>

      <div className="mt-6 space-y-3">
        {!user && (
          <>
            <Link href={`/registro?next=${next}`} className="block rounded-xl bg-brand px-4 py-3 text-center font-bold text-white">
              Crear mi cuenta
            </Link>
            <Link href={`/ingresar?next=${next}`} className="block rounded-xl border border-border px-4 py-3 text-center font-semibold">
              Ya tengo cuenta
            </Link>
          </>
        )}
        {user && sameEmail && <AcceptButton token={token} />}
        {user && !sameEmail && (
          <Alert>
            Ingresaste como {user.email}, pero la invitación es para {inv.email}. Cierra sesión e ingresa con ese correo.
          </Alert>
        )}
      </div>
    </Card>
  );
}
