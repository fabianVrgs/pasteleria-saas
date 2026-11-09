import { Suspense } from "react";
import Link from "next/link";
import { getBakeryContext } from "@/lib/auth";
import { hasRole } from "@/lib/roles";
import type { MemberRole } from "@/lib/database.types";

type Module = { icon: string; title: string; text: string; roles: MemberRole[]; href?: string; phase?: string };

const MODULES: Module[] = [
  { icon: "📝", title: "Nuevo pedido", text: "Registra un pedido de WhatsApp, Instagram, llamada o mostrador.", roles: ["vendedor"], phase: "Fase 2" },
  { icon: "📋", title: "Pedidos", text: "Busca pedidos, abonos y saldos pendientes.", roles: ["vendedor", "admin"], phase: "Fase 2" },
  { icon: "👩‍🍳", title: "Producción del día", text: "Lo que hay que preparar hoy, mañana y en la semana.", roles: ["produccion"], phase: "Fase 3" },
  { icon: "📅", title: "Calendario", text: "Agenda de entregas por día.", roles: ["produccion", "vendedor"], phase: "Fase 3" },
  { icon: "🍰", title: "Vitrina", text: "Entradas, ventas rápidas y stock.", roles: ["vendedor", "produccion"], phase: "Fase 4" },
  { icon: "🧾", title: "Catálogo", text: "Productos, precios y opciones personalizables.", roles: ["admin"], phase: "Fase 1" },
  { icon: "👥", title: "Equipo", text: "Invita vendedores y pasteleras.", roles: ["admin"], href: "equipo" },
];

export default function Page({ params }: PageProps<"/p/[slug]">) {
  return (
    <Suspense>
      <Dashboard params={params} />
    </Suspense>
  );
}

async function Dashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { roles } = await getBakeryContext(slug);
  const visible = MODULES.filter((m) => hasRole(roles, ...m.roles));

  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold">¿Qué vamos a hacer hoy?</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((m) => {
          const body = (
            <>
              <div className="text-3xl">{m.icon}</div>
              <div className="mt-2 flex items-center gap-2 font-bold">
                {m.title}
                {m.phase && <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted">Próximamente</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{m.text}</p>
            </>
          );
          return m.href ? (
            <Link key={m.title} href={`/p/${slug}/${m.href}`} className="rounded-2xl border border-border bg-white p-5 transition hover:border-brand">
              {body}
            </Link>
          ) : (
            <div key={m.title} className="rounded-2xl border border-dashed border-border bg-white/60 p-5">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
