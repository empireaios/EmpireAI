import { z } from "zod";

export const EVIDENCE_CATEGORIES = [
  "MARKET_DATA",
  "PERFORMANCE_METRIC",
  "CUSTOMER_SIGNAL",
  "COMPETITOR_INTEL",
  "FINANCIAL",
  "OPERATIONAL",
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export const EVIDENCE_SOURCES = [
  "ANALYTICS",
  "EYE",
  "INVENTORY",
  "REVIEWS",
  "FORECAST",
  "SUPPLIER",
  "COMPOSITE",
] as const;

export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

/** Evidence supporting an AI decision. */
export type DecisionEvidence = {
  evidenceId: string;
  source: EvidenceSource;
  category: EvidenceCategory;
  description: string;
  weight: number;
  reliabilityPercent: number;
  score: number;
};

export const decisionEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  source: z.enum(EVIDENCE_SOURCES),
  category: z.enum(EVIDENCE_CATEGORIES),
  description: z.string().min(1),
  weight: z.number().min(0).max(1),
  reliabilityPercent: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a DecisionEvidence record shape. */
export function validateDecisionEvidence(value: unknown): DecisionEvidence {
  return decisionEvidenceSchema.parse(value);
}
