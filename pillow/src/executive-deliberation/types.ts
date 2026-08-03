/** PILLOW-EDE-001 — Executive Deliberation Engine types. */

export type DeliberationSignificance = "routine" | "significant" | "strategic";
export type ChallengeStance = "agree" | "caution" | "respectfully_disagree";
export type UncertaintyLevel = "low" | "moderate" | "high";

export type DeliberationAlternative = {
  alternativeId: string;
  summary: string;
  expectedValue: number;
  risk: number;
  cost: number;
  complexity: number;
  longTermSustainability: number;
  empireAlignment: number;
  selected: boolean;
};

/**
 * Machine-readable deliberation record.
 * Contains executive conclusions only — never raw chain-of-thought.
 */
export type ExecutiveDeliberationResult = {
  deliberationId: string;
  deliberatedAt: string;
  significance: DeliberationSignificance;
  objectiveInference: string;
  challengeStance: ChallengeStance;
  selectedApproachSummary: string;
  alternatives: DeliberationAlternative[];
  hiddenRisks: string[];
  assumptions: string[];
  informationGaps: string[];
  longTermConsequence: string;
  constitutionalAlignmentNote: string;
  uncertaintyLevel: UncertaintyLevel;
  uncertaintyNote: string | null;
  ownerValueFocus: string;
  /** Concise conclusions for the LLM — never expose internal scratch reasoning */
  executiveConclusions: string[];
  neverExposeChainOfThought: true;
  metadataVersion: "EDE-001-v1";
};

export type DeliberateExecutiveInput = {
  userMessage: string;
  /** Optional memory / prior turns for context (non-sensitive structural text) */
  memoryContext?: string;
  currentObjective?: string | null;
};

/** Structured evidence for live certification — conclusions only, never CoT. */
export type ExecutiveDeliberationPublicSummary = {
  deliberationId: string;
  deliberatedAt: string;
  significance: DeliberationSignificance;
  objectiveInference: string;
  challengeStance: ChallengeStance;
  selectedApproachSummary: string;
  alternatives: Array<{
    summary: string;
    selected: boolean;
    expectedValue: number;
    risk: number;
  }>;
  hiddenRisks: string[];
  assumptions: string[];
  uncertaintyLevel: UncertaintyLevel;
  uncertaintyNote: string | null;
  executiveConclusions: string[];
  neverExposeChainOfThought: true;
};
