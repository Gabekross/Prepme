import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { QuestionRenderer } from "../QuestionRenderer";
import type { Question } from "../../core/types";

it("renders and limits an active-exam multi-select question without an answer key", () => {
  const question = {
    id: "q-multi",
    type: "mcq_multi",
    domain: "people",
    prompt: "Which TWO actions should the project manager take?",
    payload: {
      choices: [
        { id: "a", text: "First action" },
        { id: "b", text: "Second action" },
        { id: "c", text: "Third action" },
      ],
      minSelections: 2,
      maxSelections: 2,
    },
    // Active exam loading deliberately replaces the key with an empty object.
    answerKey: {},
  } as unknown as Question;

  const markup = renderToStaticMarkup(React.createElement(QuestionRenderer, {
    question,
    response: { type: "mcq_multi", choiceIds: ["a", "b"] },
    optionOrder: ["a", "b", "c"],
    onChange: () => {},
    showCorrect: false,
  }));

  expect(markup).toContain("Select 2–2 answers");
  expect(markup).toContain("2 selected");
  expect(markup).toContain("disabled");
  expect(markup).toContain("Third action");
});
