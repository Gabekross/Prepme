import { Suspense } from "react";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import BankClient from "./BankClient";

export default function BankPage({ params }: { params: { bankSlug: string } }) {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <BankClient bankSlug={params.bankSlug} />
      </Suspense>
    </RequireAuth>
  );
}
