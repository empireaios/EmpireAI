import { z } from "zod";

export const TREND_SIGNAL_TYPES = [
  "velocity",
  "strength",
  "momentum",
  "volatility",
  "confidence",
  "snapshot_coverage",
] as const;

export type TrendSignalType = (typeof TREND_SIGNAL_TYPES)[number];

/** Individual factor contributing to product trend analysis. */
export type TrendSignal = {
  signalType: TrendSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const trendSignalSchema = z.object({
  signalType: z.enum(TREND_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a TrendSignal record shape. */
export function validateTrendSignal(value: unknown): TrendSignal {
  return trendSignalSchema.parse(value);
}

/** Lightweight historical evidence snapshot for trend analysis. */
export type EvidenceSnapshot = {
  capturedAt: string;
  evidenceScore: number;
  averageStrength: number;
  averageConfidence: number;
  sourceDiversity: number;
  totalSignals: number;
};
