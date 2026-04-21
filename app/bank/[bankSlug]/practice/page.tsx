import { Suspense } from "react";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import PracticeClient from "./PracticeClient";

export default function PracticePage({ params }: { params: { bankSlug: string } }) {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <PracticeClient bankSlug={params.bankSlug} />
      </Suspense>
    </RequireAuth>
  );
}
