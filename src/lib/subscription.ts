import type { Bakery } from "@/lib/database.types";

export type AccessState =
  | { kind: "trial"; daysLeft: number }
  | { kind: "active"; paidUntil: string | null }
  | { kind: "read_only"; reason: string };

const DAY = 24 * 60 * 60 * 1000;

/** Hoy en Colombia, como "AAAA-MM-DD". */
export function todayInBogota(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
}

/**
 * Misma regla que la función private.bakery_is_writable de la base de datos.
 * Aquí solo se usa para mostrar avisos; quien realmente bloquea es la base de datos.
 */
export function accessState(
  b: Pick<Bakery, "status" | "trial_ends_at" | "paid_until">,
  now = new Date(),
): AccessState {
  if (b.status === "suspended") return { kind: "read_only", reason: "La cuenta está suspendida." };
  if (b.status === "trial") {
    const ms = new Date(b.trial_ends_at).getTime() - now.getTime();
    if (ms <= 0) return { kind: "read_only", reason: "La prueba gratis terminó." };
    return { kind: "trial", daysLeft: Math.ceil(ms / DAY) };
  }
  if (b.paid_until && b.paid_until < todayInBogota(now)) {
    return { kind: "read_only", reason: "La mensualidad está vencida." };
  }
  return { kind: "active", paidUntil: b.paid_until };
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  const d = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(d);
}
