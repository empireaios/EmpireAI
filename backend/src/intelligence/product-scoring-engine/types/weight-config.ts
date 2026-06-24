import type { ScoringDimension } from "./scoring-dimensions.js";

/** Per-dimension weights — normalized to sum to 1 at calculation time. */
export type ScoringWeightConfig = Record<ScoringDimension, number>;

export type ScoringWeightOverrides = Partial<ScoringWeightConfig>;
