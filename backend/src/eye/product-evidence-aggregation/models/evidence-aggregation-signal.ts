import { z } from "zod";

import type { SignalSource } from "../../global-product-signals/models/signal-source.js";

export const EVIDENCE_AGGREGATION_SIGNAL_TYPES = [
  "source_coverage",
  "strength_average",
  "confidence_average",
  "diversity",
  "trend",
  "risk",
] as const;

export type EvidenceAggregationSignalType = (typeof EVIDENCE_AGGREGATION_SIGNAL_TYPES)[number];

/** Individual factor contributing to an evidence aggregation summary. */
export type EvidenceAggregationSignal = {
  signalType: EvidenceAggregationSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const evidenceAggregationSignalSchema = z.object({
  signalType: z.enum(EVIDENCE_AGGREGATION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an EvidenceAggregationSignal record shape. */
export function validateEvidenceAggregationSignal(value: unknown): EvidenceAggregationSignal {
  return evidenceAggregationSignalSchema.parse(value);
}

export type SourceStrengthSummary = {
  source: SignalSource;
  averageStrength: number;
  averageConfidence: number;
  signalCount: number;
};
