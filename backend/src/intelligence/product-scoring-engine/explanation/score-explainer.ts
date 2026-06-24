import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import type { ProductScore } from "../types/product-score.js";

export function aggregateReasons(dimensions: DimensionScoreResult[]): string[] {
  const seen = new Set<string>();
  const reasons: string[] = [];

  for (const dimension of dimensions) {
    for (const reason of dimension.reasons) {
      if (!seen.has(reason)) {
        seen.add(reason);
        reasons.push(reason);
      }
    }
  }

  return reasons;
}

export function formatEmpireScoreExplanation(score: ProductScore): string {
  const lines = [
    `Empire Score: ${score.empireScore.toFixed(1)}`,
    "Reasons:",
    ...score.reasons,
  ];
  return lines.join("\n");
}
