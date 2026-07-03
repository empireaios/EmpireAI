import type { ProductEvaluation, ProductOpportunity, QualityTier } from "./types.js";

const QUALITY_THRESHOLD = 72;

export function evaluateProduct(product: ProductOpportunity): ProductEvaluation {
  const profitScore = Math.min(100, product.profitMarginPercent + (product.suggestedPriceUsd > 40 ? 5 : 0));
  const competitionScore =
    product.competitionLevel === "low" ? 90 :
    product.competitionLevel === "medium" ? 70 : 45;
  const demandScore = product.demandScore;
  const growthScore =
    product.growthTrend === "rising" ? 88 :
    product.growthTrend === "stable" ? 70 : 45;
  const advertisingScore = product.advertisingPotential;

  const overallScore = Math.round(
    profitScore * 0.25 +
    competitionScore * 0.2 +
    demandScore * 0.2 +
    growthScore * 0.15 +
    advertisingScore * 0.1 +
    product.customerInterest * 0.1,
  );

  const qualityTier: QualityTier =
    overallScore >= QUALITY_THRESHOLD ? "recommended" :
    overallScore >= 60 ? "review" : "reject";

  const rationale = [
    `Margin ${product.profitMarginPercent}%`,
    `Competition ${product.competitionLevel}`,
    `Demand ${product.demandScore}/100`,
    `Growth ${product.growthTrend}`,
  ].join(" · ");

  return { product, profitScore, competitionScore, demandScore, growthScore, advertisingScore, overallScore, qualityTier, rationale };
}

export function getQualityThreshold(): number {
  return QUALITY_THRESHOLD;
}

export function discoverProducts(catalog: ProductOpportunity[]): ProductEvaluation[] {
  return catalog.map(evaluateProduct);
}
