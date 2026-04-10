import { RequireAuth } from "@/lib/auth/RequireAuth";
import PracticeClient from "./PracticeClient";

export default function PracticePage({ params }: { params: { bankSlug: string } }) {
  return (
    <RequireAuth>
      <PracticeClient bankSlug={params.bankSlug} />
    </RequireAuth>
  );
}
