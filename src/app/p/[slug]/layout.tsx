import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { getBakeryContext } from "@/lib/auth";
import { hasRole, rolesText } from "@/lib/roles";
import { accessState, formatDate } from "@/lib/subscription";
import { logout } from "../../(auth)/actions";

export default function BakeryLayout({ children, params }: LayoutProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Cargando…</div>}>
      <Shell params={params}>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { bakery, roles } = await getBakeryContext(slug);
  const access = accessState(bakery);
  const isManager = hasRole(roles, "admin");

  const nav = [
    { href: `/p/${slug}`, label: "Inicio", show: true },
    { href: `/p/${slug}/equipo`, label: "Equipo", show: isManager },
    { href: `/p/${slug}/marca`, label: "Marca", show: roles.includes("owner") },
  ].filter((n) => n.show);

  // Los colores de la pastelería reemplazan a los del producto en todo lo que está dentro.
  const brandStyle = { "--brand": bakery.primary_color, "--brand-2": bakery.secondary_color } as CSSProperties;

  return (
    <div style={brandStyle} className="flex flex-1 flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href={`/p/${slug}`} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-2 text-lg">🧁</span>
            <span className="font-extrabold text-brand">{bakery.name}</span>
          </Link>
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand/10">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{rolesText(roles) || "Soporte"}</span>
            <form action={logout}>
              <button className="rounded-lg px-3 py-2 font-semibold text-muted hover:bg-background">Salir</button>
            </form>
          </div>
        </div>
      </header>

      {access.kind === "trial" && (
        <div className="bg-brand-2/30 px-4 py-2 text-center text-sm">
          Prueba gratis: te quedan <b>{access.daysLeft} {access.daysLeft === 1 ? "día" : "días"}</b>.
        </div>
      )}
      {access.kind === "read_only" && (
        <div className="bg-danger/10 px-4 py-2 text-center text-sm text-danger">
          {access.reason} Puedes consultar tu información, pero no crear ni modificar nada hasta renovar
          {bakery.paid_until ? ` (venció el ${formatDate(bakery.paid_until)})` : ""}.
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
