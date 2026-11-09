"use client";

import { useActionState } from "react";
import { Alert, SubmitButton } from "@/components/ui";
import { acceptInvitation } from "./actions";

export function AcceptButton({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvitation, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state.error && <Alert>{state.error}</Alert>}
      <SubmitButton className="w-full" pendingText="Uniéndome…">Unirme al equipo</SubmitButton>
    </form>
  );
}
