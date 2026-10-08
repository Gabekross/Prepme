import EngineClient from "@/app/engine/EngineClient";
import stagedBank from "@/staging/set-a-replacements.json";
import type { Question } from "@/src/exam-engine/core/types";

const bank = stagedBank as unknown as Question[];
const previewTypes = new Set<Question["type"]>([
  "mcq_single",
  "mcq_multi",
  "pull_down",
  "dnd_match",
  "dnd_order",
  "hotspot",
]);

export default function StagingPreviewPage({ searchParams }: { searchParams?: { type?: string } }) {
  const selectedType = searchParams?.type;
  const previewBank = selectedType && previewTypes.has(selectedType as Question["type"])
    ? bank.filter((question) => question.type === selectedType)
    : bank;
  const typeLabel = selectedType && previewBank !== bank ? ` Showing ${selectedType.replace("_", " ")} items only.` : "";

  return (
    <EngineClient
      previewBank={previewBank}
      previewBlueprint={previewBank === bank
        ? { total: bank.length, domains: { people: 59, process: 74, business_environment: 47 } }
        : { total: previewBank.length }}
      previewLabel={`Local-only Set A staging preview. This route uses the reviewed fixture and does not read or write the live question bank.${typeLabel}`}
    />
  );
}
