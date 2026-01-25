import ExamClient from "./ExamClient";

export default function ExamPage({ params }: { params: { bankSlug: string } }) {
  return <ExamClient bankSlug={params.bankSlug} />;
}
