import type { Question } from "../core/types";

export function correctAnswerLines(question: Question): string[] {
  switch (question.type) {
    case "mcq_single":
    case "pull_down": {
      const choice = question.payload.choices.find((item) => item.id === question.answerKey.correctChoiceId);
      return [choice?.text ?? question.answerKey.correctChoiceId];
    }
    case "mcq_multi":
      return question.answerKey.correctChoiceIds.map((id) =>
        question.payload.choices.find((item) => item.id === id)?.text ?? id
      );
    case "dnd_match":
      return question.payload.prompts.map((prompt) => {
        const answerId = question.answerKey.mapping[prompt.id];
        const answer = question.payload.answers.find((item) => item.id === answerId);
        return `${prompt.text} → ${answer?.text ?? answerId ?? "Answer unavailable"}`;
      });
    case "dnd_order":
      return question.answerKey.orderedIds.map((id) =>
        question.payload.items.find((item) => item.id === id)?.text ?? id
      );
    case "hotspot":
      return [`Region ${question.answerKey.correctRegionId}`];
  }
}
