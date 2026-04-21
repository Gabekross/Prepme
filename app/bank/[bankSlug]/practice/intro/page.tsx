import { Suspense } from "react";
import { RequireAuth } from "@/lib/auth/RequireAuth";
import PracticeIntroClient from "./PracticeIntroClient";

export default function PracticeIntroPage({ params }: { params: { bankSlug: string } }) {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <PracticeIntroClient bankSlug={params.bankSlug} />
      </Suspense>
    </RequireAuth>
  );
}
