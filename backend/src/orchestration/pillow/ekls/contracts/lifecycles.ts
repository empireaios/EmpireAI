/**
 * EKLS — Canonical lifecycle stage definitions.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

export const EKLS_KNOWLEDGE_LIFECYCLE = [
  "discover",
  "validate",
  "store",
  "link",
  "version",
  "govern",
  "retrieve",
  "reuse",
  "supersede",
  "archive",
  "recover",
  "retire",
] as const;

export const EKLS_EXPERIENCE_LIFECYCLE = [
  "observe",
  "capture",
  "classify",
  "store",
  "link",
  "evaluate",
  "learn",
  "retain",
  "archive",
  "recover",
] as const;

export const EKLS_LEARNING_LIFECYCLE = [
  "observe",
  "compare",
  "identify_patterns",
  "measure_confidence",
  "accumulate_experience",
  "improve_knowledge",
] as const;

export const EKLS_EVIDENCE_LIFECYCLE = [
  "collect",
  "validate",
  "link",
  "store",
  "rank",
  "reference",
  "archive",
  "recover",
] as const;

export const EKLS_CONFIDENCE_LIFECYCLE = [
  "initial",
  "evidence_adjustment",
  "historical_adjustment",
  "experience_adjustment",
  "model_adjustment",
  "human_override",
  "pillow_governance",
  "historical_preservation",
] as const;

export const EKLS_DECISION_LIFECYCLE = [
  "proposal",
  "analysis",
  "decision",
  "execution",
  "outcome",
  "evidence",
  "lessons",
  "future_reference",
] as const;

export type EklsLifecycleDomain =
  | "knowledge"
  | "experience"
  | "learning"
  | "evidence"
  | "confidence"
  | "decision";

export const EKLS_LIFECYCLE_REGISTRY: Record<EklsLifecycleDomain, readonly string[]> = {
  knowledge: EKLS_KNOWLEDGE_LIFECYCLE,
  experience: EKLS_EXPERIENCE_LIFECYCLE,
  learning: EKLS_LEARNING_LIFECYCLE,
  evidence: EKLS_EVIDENCE_LIFECYCLE,
  confidence: EKLS_CONFIDENCE_LIFECYCLE,
  decision: EKLS_DECISION_LIFECYCLE,
};
