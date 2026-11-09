"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

export type FormState = { error?: string; message?: string };

async function origin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

function translate(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Primero confirma tu correo (revisa tu bandeja de entrada o spam).";
  if (m.includes("already registered")) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (m.includes("password")) return "La contraseña debe tener al menos 8 caracteres.";
  if (m.includes("rate limit")) return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  return "Ocurrió un error. Inténtalo de nuevo.";
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: translate(error.message) };
  redirect(safeNext(formData.get("next")));
}

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"), "/crear-pasteleria");

  if (fullName.length < 2) return { error: "Escribe tu nombre." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: translate(error.message) };

  // Si el proyecto no exige confirmar el correo, ya hay sesión y seguimos directo.
  if (data.session) redirect(next);
  return { message: `Te enviamos un correo a ${email}. Ábrelo y confirma tu cuenta para continuar.` };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(formData.get("email") ?? "").trim(), {
    redirectTo: `${await origin()}/auth/callback?next=/nueva-clave`,
  });
  // Siempre el mismo mensaje, para no revelar qué correos tienen cuenta.
  return { message: "Si ese correo tiene cuenta, te llegará un enlace para crear una nueva contraseña." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translate(error.message) };
  redirect("/inicio");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ingresar");
}
