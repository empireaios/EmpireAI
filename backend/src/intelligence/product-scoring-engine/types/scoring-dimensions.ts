/** Scoring dimensions used by the Empire Product Scoring Engine. */
export type ScoringDimension =
  | "demand"
  | "competition"
  | "margin"
  | "supplierTrust"
  | "shipping"
  | "brandability"
  | "advertisementPotential"
  | "trendMomentum"
  | "risk";

export const SCORING_DIMENSIONS: readonly ScoringDimension[] = [
  "demand",
  "competition",
  "margin",
  "supplierTrust",
  "shipping",
  "brandability",
  "advertisementPotential",
  "trendMomentum",
  "risk",
] as const;

export type DimensionScoreResult = {
  dimension: ScoringDimension;
  /** Normalized dimension score 0–100 (higher is better for all dimensions, including risk). */
  score: number;
  /** Configured weight before normalization. */
  weight: number;
  /** Human-readable reason lines prefixed with + or -. */
  reasons: string[];
};
