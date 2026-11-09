import Link from "next/link";

const features = [
  { icon: "📝", title: "Pedidos en un solo lugar", text: "WhatsApp, Instagram, llamada o mostrador: todo queda registrado igual." },
  { icon: "👩‍🍳", title: "Producción por días", text: "La pastelera ve qué preparar hoy, mañana y en la semana, con todos los detalles." },
  { icon: "💳", title: "Anticipos claros", text: "Abono, saldo, método de pago y foto del comprobante en cada pedido." },
  { icon: "🍰", title: "Vitrina", text: "Lo que entra y lo que se vende, siempre con el stock al día." },
];

export default function Home() {
  return (
    <main className="flex-1">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="text-lg font-extrabold text-brand">🧁 Pedidos Pastelería</span>
        <Link href="/ingresar" className="rounded-xl px-4 py-2 font-semibold text-brand hover:bg-brand/10">
          Ingresar
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-12 pt-8 text-center sm:pt-16">
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
          Quien vende y quien prepara, <span className="text-brand">trabajando sobre el mismo pedido</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Sin papelitos ni mensajes perdidos. Hecho para pastelerías en Colombia.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/registro" className="w-full rounded-xl bg-brand px-6 py-3 font-bold text-white sm:w-auto">
            Prueba 15 días gratis
          </Link>
          <Link href="/ingresar" className="w-full rounded-xl border border-border bg-white px-6 py-3 font-semibold sm:w-auto">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-white p-5">
            <div className="text-2xl">{f.icon}</div>
            <h2 className="mt-2 font-bold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
