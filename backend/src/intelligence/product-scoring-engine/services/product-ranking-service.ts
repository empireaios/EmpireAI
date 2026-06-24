import type { ProductScore } from "../types/product-score.js";

export type ProductRankingOptions = {
  /** Prefer higher confidence when empire scores tie. Default true. */
  useConfidenceTieBreaker?: boolean;
};

function compareProductScores(
  a: ProductScore,
  b: ProductScore,
  useConfidenceTieBreaker: boolean,
): number {
  if (b.empireScore !== a.empireScore) {
    return b.empireScore - a.empireScore;
  }

  if (useConfidenceTieBreaker && b.confidence !== a.confidence) {
    return b.confidence - a.confidence;
  }

  const titleCompare = a.signalReference.productTitle.localeCompare(
    b.signalReference.productTitle,
  );
  if (titleCompare !== 0) return titleCompare;

  return a.signalReference.signalId.localeCompare(b.signalReference.signalId);
}

export function rankProducts(
  scores: ProductScore[],
  options: ProductRankingOptions = {},
): ProductScore[] {
  const useConfidenceTieBreaker = options.useConfidenceTieBreaker ?? true;
  return [...scores].sort((a, b) => compareProductScores(a, b, useConfidenceTieBreaker));
}
