import { ENTERPRISE_DOMAINS, PERMANENT_OPERATING_CYCLE } from "./loops.js";
import { PERMANENT_EXECUTIVE_QUESTION } from "./version.js";
import type { OperatingRhythmCadence, OperatingRhythmReview } from "./types.js";

const CADENCE_QUESTIONS: Record<OperatingRhythmCadence, string[]> = {
  continuous: [
    "What changed?",
    "What requires attention?",
    "What opportunity or risk is emerging?",
  ],
  daily: [
    "Did the Empire become stronger today?",
    "What increased or reduced Empire Value?",
    "What surprised us?",
    "What should happen or stop tomorrow?",
    "What opportunity cannot be ignored?",
  ],
  weekly: [
    "Are current priorities still correct?",
    "Should capital or resources move?",
    "Which portfolio items deserve expansion or retirement?",
    "Have assumptions changed?",
  ],
  monthly: [
    "Are we becoming stronger, wiser, faster, more resilient?",
    "How is the opportunity pipeline evolving?",
    "What is constitutional compliance status?",
    "What is learning velocity?",
  ],
  quarterly: [
    "If we started today, would we build the same businesses?",
    "Would we allocate capital differently?",
    "What should no longer exist?",
    "What would we build first as founders?",
  ],
};

/**
 * Callable operating-rhythm review scaffold.
 * Surfaces real constitutional questions and domain coverage — not a fake dashboard.
 */
export function runOperatingRhythmReview(
  cadence: OperatingRhythmCadence,
  options?: {
    signals?: string[];
    recommendations?: string[];
    evidenceGaps?: string[];
    requiredApprovals?: string[];
  },
): OperatingRhythmReview {
  return {
    cadence,
    generatedAt: new Date().toISOString(),
    permanentQuestion: PERMANENT_EXECUTIVE_QUESTION,
    focusQuestions: [...CADENCE_QUESTIONS[cadence]],
    domainsMonitored: [...ENTERPRISE_DOMAINS],
    signals: options?.signals ?? [],
    recommendations: options?.recommendations ?? [],
    requiredApprovals: options?.requiredApprovals ?? [],
    evidenceGaps: options?.evidenceGaps ?? [],
  };
}

export function describeOperatingRhythmDoctrine(): {
  cycle: readonly string[];
  cadences: OperatingRhythmCadence[];
  domains: readonly string[];
} {
  return {
    cycle: PERMANENT_OPERATING_CYCLE,
    cadences: ["continuous", "daily", "weekly", "monthly", "quarterly"],
    domains: ENTERPRISE_DOMAINS,
  };
}
