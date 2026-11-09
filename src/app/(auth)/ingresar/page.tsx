import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "../forms";

export const metadata: Metadata = { title: "Ingresar" };

export default function Page() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
