import type { DimensionScoreResult } from "./scoring-dimensions.js";

export type ProductSignalReference = {
  signalId: string;
  providerId: string;
  productTitle: string;
  workspaceId: string;
  subjectKey: string;
};

/** Full Empire score output for a single ProductSignal. */
export type ProductScore = {
  /** Weighted Empire Score 0–100 (one decimal). */
  empireScore: number;
  dimensions: DimensionScoreResult[];
  /** Aggregate confidence 0–100 based on signal completeness and source hints. */
  confidence: number;
  scoredAt: string;
  signalReference: ProductSignalReference;
  /** Flattened human-readable reasons from all dimensions. */
  reasons: string[];
};
