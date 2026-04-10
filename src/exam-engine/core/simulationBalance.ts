/**
 * Simulation mode assembly balancing.
 * Provides mild difficulty distribution balancing when assembling a simulation exam,
 * without adaptive mid-exam intervention.
 */

import type { Blueprint, Difficulty, Question } from "./types";
import {
  SIMULATION_BALANCE_DIFFICULTY,
  SIMULATION_DIFFICULTY_MIX,
  DEFAULT_DIFFICULTY,
} from "./adaptiveConfig";

/**
 * Enhance a blueprint with approximate difficulty quotas for simulation mode.
 * Only applies if SIMULATION_BALANCE_DIFFICULTY is enabled.
 * Returns a new blueprint (does not mutate the original).
 */
export function balanceSimulationBlueprint(bp: Blueprint): Blueprint {
  if (!SIMULATION_BALANCE_DIFFICULTY) return bp;
  if (bp.difficulty) return bp; // Already has difficulty quotas

  const total = bp.total;
  const difficulty: Partial<Record<Difficulty, number>> = {};

  for (const [level, fraction] of Object.entries(SIMULATION_DIFFICULTY_MIX)) {
    const d = Number(level) as Difficulty;
    difficulty[d] = Math.round(total * (fraction ?? 0));
  }

  // Adjust rounding error: add/remove from difficulty 3
  const sum = Object.values(difficulty).reduce((a, b) => a + (b ?? 0), 0);
  const diff3 = difficulty[3] ?? 0;
  difficulty[3] = diff3 + (total - sum);

  return { ...bp, difficulty };
}
