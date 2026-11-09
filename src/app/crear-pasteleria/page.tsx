import type { Metadata } from "next";
import { CreateBakeryForm } from "./form";

export const metadata: Metadata = { title: "Crear pastelería" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <CreateBakeryForm />
    </main>
  );
}
