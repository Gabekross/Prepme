import { RequireAuth } from "@/lib/auth/RequireAuth";
import ExamClient from "./ExamClient";

export default function ExamPage({ params }: { params: { bankSlug: string } }) {
  return (
    <RequireAuth>
      <ExamClient bankSlug={params.bankSlug} />
    </RequireAuth>
  );
}
