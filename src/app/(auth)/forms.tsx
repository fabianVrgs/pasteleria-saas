"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Card, Input, Label, SubmitButton } from "@/components/ui";
import { login, requestPasswordReset, signup, updatePassword, type FormState } from "./actions";

const initial: FormState = {};

function NextField() {
  const next = useSearchParams().get("next") ?? "";
  return <input type="hidden" name="next" value={next} />;
}

/** Mantiene ?next=... al pasar entre "ingresar" y "registro" (por ejemplo, desde una invitación). */
function useNextQuery() {
  const next = useSearchParams().get("next");
  return next ? `?next=${encodeURIComponent(next)}` : "";
}

export function LoginForm() {
  const [state, action] = useActionState(login, initial);
  const nextQuery = useNextQuery();
  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold">Ingresar</h1>
      <p className="mb-5 text-sm text-muted">Entra con el correo y la contraseña de tu cuenta.</p>
      <form action={action} className="space-y-4">
        <NextField />
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        <SubmitButton className="w-full" pendingText="Entrando…">Ingresar</SubmitButton>
      </form>
      <div className="mt-5 flex flex-col gap-2 text-center text-sm">
        <Link href="/recuperar" className="text-muted underline">¿Olvidaste tu contraseña?</Link>
        <span>
          ¿No tienes cuenta?{" "}
          <Link href={`/registro${nextQuery}`} className="font-semibold text-brand underline">Regístrate</Link>
        </span>
      </div>
    </Card>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signup, initial);
  const nextQuery = useNextQuery();
  if (state.message) {
    return (
      <Card>
        <h1 className="mb-3 text-xl font-bold">Revisa tu correo 📬</h1>
        <Alert tone="ok">{state.message}</Alert>
      </Card>
    );
  }
  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold">Crear cuenta</h1>
      <p className="mb-5 text-sm text-muted">
        Regístrate para crear tu pastelería (15 días gratis) o para unirte al equipo que te invitó.
      </p>
      <form action={action} className="space-y-4">
        <NextField />
        <div>
          <Label htmlFor="full_name">Tu nombre</Label>
          <Input id="full_name" name="full_name" autoComplete="name" required maxLength={120} />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Contraseña (mínimo 8 caracteres)</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        <SubmitButton className="w-full" pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/ingresar${nextQuery}`} className="font-semibold text-brand underline">Ingresa</Link>
      </p>
    </Card>
  );
}

export function ResetForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);
  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold">Recuperar contraseña</h1>
      <p className="mb-5 text-sm text-muted">Te enviaremos un enlace para crear una nueva.</p>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        {state.message && <Alert tone="ok">{state.message}</Alert>}
        <SubmitButton className="w-full" pendingText="Enviando…">Enviar enlace</SubmitButton>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/ingresar" className="text-brand underline">Volver a ingresar</Link>
      </p>
    </Card>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, initial);
  return (
    <Card>
      <h1 className="mb-5 text-xl font-bold">Nueva contraseña</h1>
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="password">Nueva contraseña (mínimo 8 caracteres)</Label>
          <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        </div>
        {state.error && <Alert>{state.error}</Alert>}
        <SubmitButton className="w-full">Guardar</SubmitButton>
      </form>
    </Card>
  );
}
