import type { ProductEvaluation, SupplierRanking, WinningProductScore, MarketAnalysis } from "./types.js";
import { getQualityThreshold } from "./product-scorer.js";

export function rankWinningProducts(input: {
  evaluations: ProductEvaluation[];
  supplierRankings: SupplierRanking[];
  marketAnalyses: MarketAnalysis[];
}): WinningProductScore[] {
  const threshold = getQualityThreshold();

  return input.evaluations
    .map((evaluation) => {
      const supplierRanking =
        input.supplierRankings.find((r) => r.supplier.id === evaluation.product.supplierId) ?? null;

      const marketFit = computeMarketFit(evaluation.product.marketIds, input.marketAnalyses);
      const sustainabilityScore = computeSustainability(evaluation, supplierRanking);

      const compositeScore = Math.round(
        evaluation.overallScore * 0.45 +
        (supplierRanking?.compositeScore ?? 50) * 0.25 +
        marketFit * 0.2 +
        sustainabilityScore * 0.1,
      );

      return {
        product: evaluation.product,
        evaluation,
        supplierRanking,
        marketFit,
        sustainabilityScore,
        compositeScore,
        aboveThreshold: compositeScore >= threshold && evaluation.qualityTier !== "reject",
      };
    })
    .filter((w) => w.aboveThreshold)
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

function computeMarketFit(marketIds: string[], analyses: MarketAnalysis[]): number {
  const matched = analyses.filter((a) => marketIds.includes(a.market.id));
  if (matched.length === 0) return 50;
  return Math.round(matched.reduce((sum, m) => sum + m.opportunityScore, 0) / matched.length);
}

function computeSustainability(
  evaluation: ProductEvaluation,
  supplier: SupplierRanking | null,
): number {
  let score = evaluation.growthScore;
  if (evaluation.product.competitionLevel === "low") score += 10;
  if (supplier?.preferred) score += 8;
  if (evaluation.product.growthTrend === "declining") score -= 20;
  return Math.min(100, Math.max(0, score));
}
