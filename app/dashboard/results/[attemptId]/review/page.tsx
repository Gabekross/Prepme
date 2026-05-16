import { RequireAuth } from "@/lib/auth/RequireAuth";
import ReviewClient from "./ReviewClient";

export const metadata = {
  title: "Review Questions",
};

export default function ReviewPage({
  params,
}: {
  params: { attemptId: string };
}) {
  return (
    <RequireAuth>
      <ReviewClient attemptId={params.attemptId} />
    </RequireAuth>
  );
}
