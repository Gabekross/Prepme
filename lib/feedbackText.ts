/** Letters from any language, numbers, whitespace, and ordinary sentence punctuation. */
const unsupportedFeedbackCharacters = /[^-\p{L}\p{M}\p{N}\s.,!?'"():;]/gu;

export function cleanFeedbackText(value: string) {
  return value.replace(unsupportedFeedbackCharacters, "");
}

export function hasUnsupportedFeedbackCharacters(value: string) {
  return /[^-\p{L}\p{M}\p{N}\s.,!?'"():;]/u.test(value);
}

export const feedbackCharacterHelp = "Use letters, numbers, spaces, and normal sentence punctuation only.";
