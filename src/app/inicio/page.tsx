import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin, requireUser } from "@/lib/auth";
import { rolesText } from "@/lib/roles";
import { logout } from "../(auth)/actions";

export const metadata: Metadata = { title: "Inicio" };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <Suspense fallback={<p className="text-muted">Cargando…</p>}>
        <MyBakeries />
      </Suspense>
    </main>
  );
}

/** Después de ingresar: si el usuario tiene una sola pastelería, entra directo. */
async function MyBakeries() {
  const user = await requireUser("/inicio");
  const supabase = await createClient();
  const [{ data: memberships }, admin] = await Promise.all([
    supabase
      .from("bakery_members")
      .select("roles, bakeries(name, slug)")
      .eq("user_id", user.id)
      .eq("active", true),
    isPlatformAdmin(),
  ]);

  const list = (memberships ?? []).filter((m) => m.bakeries);
  if (list.length === 1 && !admin) redirect(`/p/${list[0].bakeries!.slug}`);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Hola 👋</h1>
      {list.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="mb-4">Todavía no perteneces a ninguna pastelería.</p>
          <p className="mb-4 text-sm text-muted">
            Si alguien te invitó, abre el enlace de invitación que te enviaron. Si eres dueño, crea tu pastelería:
          </p>
          <Link href="/crear-pasteleria" className="inline-block rounded-xl bg-brand px-5 py-3 font-bold text-white">
            Crear mi pastelería
          </Link>
        </div>
      )}
      {list.map((m) => (
        <Link
          key={m.bakeries!.slug}
          href={`/p/${m.bakeries!.slug}`}
          className="block rounded-2xl border border-border bg-white p-5 transition hover:border-brand"
        >
          <div className="font-bold">{m.bakeries!.name}</div>
          <div className="text-sm text-muted">{rolesText(m.roles)}</div>
        </Link>
      ))}
      {admin && (
        <Link href="/admin" className="block rounded-2xl border border-brand bg-brand/5 p-5 font-bold text-brand">
          🛠️ Panel de super-administrador
        </Link>
      )}
      <form action={logout}>
        <button className="text-sm text-muted underline">Cerrar sesión ({user.email})</button>
      </form>
    </div>
  );
}
