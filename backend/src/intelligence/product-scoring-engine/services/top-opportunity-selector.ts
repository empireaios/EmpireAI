import type { ProductScore } from "../types/product-score.js";
import { rankProducts } from "./product-ranking-service.js";

export type TopOpportunityThresholds = {
  minEmpireScore?: number;
  minConfidence?: number;
};

export function selectTopOpportunities(
  scores: ProductScore[],
  topN: number,
  thresholds: TopOpportunityThresholds = {},
): ProductScore[] {
  const minEmpireScore = thresholds.minEmpireScore ?? 0;
  const minConfidence = thresholds.minConfidence ?? 0;

  const eligible = scores.filter(
    (score) => score.empireScore >= minEmpireScore && score.confidence >= minConfidence,
  );

  return rankProducts(eligible).slice(0, Math.max(0, topN));
}
