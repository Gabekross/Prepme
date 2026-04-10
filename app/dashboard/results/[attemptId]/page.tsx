import { RequireAuth } from "@/lib/auth/RequireAuth";
import ResultsClient from "./ResultsClient";

export const metadata = {
  title: "Attempt Results",
};

export default function ResultsPage({
  params,
}: {
  params: { attemptId: string };
}) {
  return (
    <RequireAuth>
      <ResultsClient attemptId={params.attemptId} />
    </RequireAuth>
  );
}
