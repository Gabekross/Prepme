import BankClient from "./BankClient";

export default function BankPage({ params }: { params: { bankSlug: string } }) {
  return <BankClient bankSlug={params.bankSlug} />;
}
