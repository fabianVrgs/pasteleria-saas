import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupForm } from "../forms";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function Page() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
