import { describe, expect, it } from "vitest";
import { cleanFeedbackText, hasUnsupportedFeedbackCharacters } from "./feedbackText";

describe("feedback text validation", () => {
  it("keeps international letters, numbers, whitespace, and sentence punctuation", () => {
    const value = "It broke on question 6. Ça fonctionne maintenant? Don't remove this - please!";
    expect(cleanFeedbackText(value)).toBe(value);
    expect(hasUnsupportedFeedbackCharacters(value)).toBe(false);
  });

  it("removes unsupported symbols and markup characters", () => {
    expect(cleanFeedbackText("Bad <script> & @user #1 ✅")).toBe("Bad script  user 1 ");
    expect(hasUnsupportedFeedbackCharacters("hello@example.com")).toBe(true);
  });
});
