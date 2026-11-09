import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-5xl">🍰</div>
      <h1 className="mt-3 text-2xl font-extrabold">No encontramos esta página</h1>
      <p className="mt-2 text-muted">Puede que no exista o que no tengas acceso a ella.</p>
      <Link href="/inicio" className="mt-6 rounded-xl bg-brand px-5 py-3 font-bold text-white">Ir al inicio</Link>
    </main>
  );
}
