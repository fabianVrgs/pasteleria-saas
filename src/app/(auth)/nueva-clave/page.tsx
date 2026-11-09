import { Suspense } from "react";
import type { Metadata } from "next";
import { NewPasswordForm } from "../forms";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function Page() {
  return (
    <Suspense>
      <NewPasswordForm />
    </Suspense>
  );
}
