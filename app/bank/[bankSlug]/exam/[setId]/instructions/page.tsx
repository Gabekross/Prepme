import { RequireAuth } from "@/lib/auth/RequireAuth";
import InstructionClient from "./InstructionClient";

export default function InstructionPage({
  params,
}: {
  params: { bankSlug: string; setId: string };
}) {
  return (
    <RequireAuth>
      <InstructionClient bankSlug={params.bankSlug} setSlug={params.setId} />
    </RequireAuth>
  );
}
