"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

/* Piezas de interfaz reutilizables. Todas son responsive y fáciles de tocar en celular. */

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6 ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }: ComponentProps<"label">) {
  return <label className={`mb-1 block text-sm font-semibold ${className}`} {...props} />;
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      className={`w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
      {...props}
    />
  );
}

type Variant = "primary" | "secondary" | "danger" | "ghost";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:opacity-90",
  secondary: "border border-border bg-white text-foreground hover:bg-background",
  danger: "border border-danger/30 bg-white text-danger hover:bg-danger/5",
  ghost: "text-brand hover:bg-brand/10",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

/** Botón de formulario que se desactiva mientras se envía. */
export function SubmitButton({
  children,
  pendingText = "Guardando…",
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

export function Alert({ tone = "danger", children }: { tone?: "danger" | "ok" | "info"; children: ReactNode }) {
  const styles = {
    danger: "border-danger/30 bg-danger/5 text-danger",
    ok: "border-ok/30 bg-ok/5 text-ok",
    info: "border-brand/30 bg-brand/5 text-brand",
  }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
