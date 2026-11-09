import { Suspense } from "react";
import type { Metadata } from "next";
import { requireBakeryRole } from "@/lib/auth";
import { BrandForm } from "./form";

export const metadata: Metadata = { title: "Marca" };

export default function Page({ params }: PageProps<"/p/[slug]/marca">) {
  return (
    <Suspense>
      <Brand params={params} />
    </Suspense>
  );
}

async function Brand({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { bakery } = await requireBakeryRole(slug, "owner");
  return (
    <div className="max-w-lg">
      <h1 className="mb-5 text-2xl font-extrabold">Marca de la pastelería</h1>
      <BrandForm
        bakeryId={bakery.id}
        slug={slug}
        name={bakery.name}
        primary={bakery.primary_color}
        secondary={bakery.secondary_color}
      />
      <p className="mt-4 text-sm text-muted">El logo y la dirección propia (subdominio) llegan en la Fase 5.</p>
    </div>
  );
}
