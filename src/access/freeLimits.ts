export const FREE_PRACTICE_SESSION_LIMIT = 20;
export const FREE_PRACTICE_LIFETIME_LIMIT = 50;
export const FREE_EXAM_SET_ID = "set_a";
export const EXAM_EXPIRY_GRACE_MINUTES = 30;
export const PRACTICE_ABANDON_AFTER_DAYS = 7;

export type AccessMode = "practice" | "exam";
export type AccessReason =
  | "ALLOWED"
  | "PRO_REQUIRED"
  | "FREE_PRACTICE_SESSION_LIMIT"
  | "FREE_PRACTICE_LIMIT_REACHED"
  | "FREE_SET_A_USED"
  | "INVALID_REQUEST";

export function normalizeSetId(setId?: string | null) {
  if (!setId) return null;
  return setId.replace(/-/g, "_").toLowerCase();
}

export function isFreeExamSet(setId?: string | null) {
  return normalizeSetId(setId) === FREE_EXAM_SET_ID;
}

export function freePracticeRemaining(used: number) {
  return Math.max(0, FREE_PRACTICE_LIFETIME_LIMIT - Math.max(0, used));
}

export function buildAccessMessage(reason: AccessReason, remainingPracticeQuestions = 0) {
  switch (reason) {
    case "PRO_REQUIRED":
      return "Upgrade to Premium to unlock this exam set.";
    case "FREE_PRACTICE_SESSION_LIMIT":
      return `Free practice sessions are limited to ${FREE_PRACTICE_SESSION_LIMIT} questions.`;
    case "FREE_PRACTICE_LIMIT_REACHED":
      return remainingPracticeQuestions > 0
        ? `You have ${remainingPracticeQuestions} free practice questions left. Choose a smaller session or upgrade.`
        : "You have used your free practice questions. Upgrade to keep practicing.";
    case "FREE_SET_A_USED":
      return "Set A is free once. Upgrade to retake Set A and unlock Sets B and C.";
    case "INVALID_REQUEST":
      return "This request could not be checked. Please try again.";
    case "ALLOWED":
    default:
      return "";
  }
}
