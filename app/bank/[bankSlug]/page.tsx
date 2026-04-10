import { RequireAuth } from "@/lib/auth/RequireAuth";
import BankClient from "./BankClient";

export default function BankPage({ params }: { params: { bankSlug: string } }) {
  return (
    <RequireAuth>
      <BankClient bankSlug={params.bankSlug} />
    </RequireAuth>
  );
}
