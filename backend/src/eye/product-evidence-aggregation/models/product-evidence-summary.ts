import { z } from "zod";

import type { SignalSource } from "../../global-product-signals/models/signal-source.js";
import { SIGNAL_SOURCES } from "../../global-product-signals/models/signal-source.js";
import {
  evidenceAggregationSignalSchema,
  type EvidenceAggregationSignal,
  type SourceStrengthSummary,
} from "./evidence-aggregation-signal.js";

export type ProductEvidenceSummaryId = string;

export const EVIDENCE_TREND_DIRECTIONS = ["rising", "stable", "falling"] as const;
export type EvidenceTrendDirection = (typeof EVIDENCE_TREND_DIRECTIONS)[number];

/** Aggregated outside-world evidence summary for a product. */
export type ProductEvidenceSummary = {
  id: ProductEvidenceSummaryId;
  workspaceId: string;
  productId: string;
  totalSignals: number;
  sourceDiversity: number;
  averageStrength: number;
  averageConfidence: number;
  strongestSource: SignalSource;
  weakestSource: SignalSource;
  evidenceScore: number;
  trendDirection: EvidenceTrendDirection;
  riskFlags: string[];
  sourceBreakdown: SourceStrengthSummary[];
  signals: EvidenceAggregationSignal[];
  createdAt: string;
  updatedAt: string;
};

export type ProductEvidenceSummaryCreateInput = Omit<
  ProductEvidenceSummary,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type ProductEvidenceSummaryUpdateInput = Partial<
  Omit<ProductEvidenceSummaryCreateInput, "productId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

const sourceStrengthSummarySchema = z.object({
  source: z.enum(SIGNAL_SOURCES),
  averageStrength: z.number().min(0).max(100),
  averageConfidence: z.number().min(0).max(100),
  signalCount: z.number().int().min(1),
});

export const productEvidenceSummarySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  totalSignals: z.number().int().min(0),
  sourceDiversity: z.number().min(0).max(100),
  averageStrength: z.number().min(0).max(100),
  averageConfidence: z.number().min(0).max(100),
  strongestSource: z.enum(SIGNAL_SOURCES),
  weakestSource: z.enum(SIGNAL_SOURCES),
  evidenceScore: z.number().min(0).max(100),
  trendDirection: z.enum(EVIDENCE_TREND_DIRECTIONS),
  riskFlags: z.array(z.string()),
  sourceBreakdown: z.array(sourceStrengthSummarySchema),
  signals: z.array(evidenceAggregationSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ProductEvidenceSummary record shape. */
export function validateProductEvidenceSummary(value: unknown): ProductEvidenceSummary {
  return productEvidenceSummarySchema.parse(value);
}
