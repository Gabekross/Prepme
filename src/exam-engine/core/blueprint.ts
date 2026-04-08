import type { Blueprint, Difficulty, Domain, Question, QuestionType } from "./types";

function hasAll(tags: string[], include?: string[]) {
  if (!include?.length) return true;
  return include.every((t) => tags.includes(t));
}
function hasNone(tags: string[], exclude?: string[]) {
  if (!exclude?.length) return true;
  return !exclude.some((t) => tags.includes(t));
}

export function filterBank(bank: Question[], bp: Blueprint): Question[] {
  return bank.filter((q) => {
    if (bp.accessTier && (q.accessTier ?? "free") !== bp.accessTier) return false;
    if (bp.setId && (q.setId ?? "free") !== bp.setId) return false;
    const tags = q.tags ?? [];
    if (!hasAll(tags, bp.includeTags)) return false;
    if (!hasNone(tags, bp.excludeTags)) return false;
    return true;
  });
}

/**
 * Select questions from the bank according to the blueprint.
 *
 * Selection priority order:
 *   1. Domain quotas  (bp.domains)
 *   2. Question-type quotas  (bp.types)
 *   3. Difficulty quotas  (bp.difficulty)  ← NEW
 *   4. Fill remaining slots from whatever is left in the pool
 *
 * Backward compatible: if bp.difficulty is omitted, behaviour is unchanged.
 */
export function selectByBlueprint(bank: Question[], bp: Blueprint): Question[] {
  const pool = [...bank];
  const picked: Question[] = [];
  const pickOne = (pred: (q: Question) => boolean) => {
    const idx = pool.findIndex(pred);
    if (idx >= 0) picked.push(pool.splice(idx, 1)[0]);
  };

  if (bp.domains) {
    (Object.keys(bp.domains) as Domain[]).forEach((d) => {
      const count = bp.domains?.[d] ?? 0;
      for (let i = 0; i < count; i++) pickOne((q) => q.domain === d);
    });
  }

  if (bp.types) {
    (Object.keys(bp.types) as QuestionType[]).forEach((t) => {
      const count = bp.types?.[t] ?? 0;
      for (let i = 0; i < count; i++) pickOne((q) => q.type === t);
    });
  }

  // Difficulty-based quota selection.
  // Questions without a difficulty value are treated as moderate (2) for selection purposes,
  // ensuring backward compatibility with older questions that predate the difficulty field.
  if (bp.difficulty) {
    (Object.keys(bp.difficulty).map(Number) as Difficulty[]).forEach((d) => {
      const count = bp.difficulty?.[d] ?? 0;
      for (let i = 0; i < count; i++) {
        pickOne((q) => (q.difficulty ?? 2) === d);
      }
    });
  }

  while (picked.length < bp.total && pool.length) picked.push(pool.shift()!);
  return picked.slice(0, bp.total);
}
