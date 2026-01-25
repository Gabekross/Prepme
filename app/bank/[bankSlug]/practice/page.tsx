import PracticeClient from "./PracticeClient";

export default function PracticePage({ params }: { params: { bankSlug: string } }) {
  return <PracticeClient bankSlug={params.bankSlug} />;
}
