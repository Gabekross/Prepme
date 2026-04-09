import ExamClient from "../ExamClient";

export default function ExamSetPage({
  params,
}: {
  params: { bankSlug: string; setId: string };
}) {
  return <ExamClient bankSlug={params.bankSlug} setId={params.setId} />;
}
