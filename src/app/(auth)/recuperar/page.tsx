import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetForm } from "../forms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Page() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
