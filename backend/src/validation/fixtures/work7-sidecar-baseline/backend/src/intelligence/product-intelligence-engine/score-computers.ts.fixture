import type {
  HistoricalDemand,
  ProductIntelligenceInput,
  ProductIntelligenceScores,
  ProductSupplierData,
} from "./types.js";

function clamp(score: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(score)));
}

/** Demand score from historical search volume, trend, and seasonality — independent of other dimensions. */
export function computeDemandScore(historicalDemand: HistoricalDemand): number {
  const trendBonus =
    historicalDemand.trendDirection === "rising"
      ? 12
      : historicalDemand.trendDirection === "falling"
        ? -15
        : 0;
  const seasonality = historicalDemand.seasonalityIndex ?? 50;
  const volumeComponent = clamp(historicalDemand.searchVolumeIndex);
  const seasonalityComponent = seasonality >= 70 ? 8 : seasonality <= 30 ? -5 : 0;

  return clamp(volumeComponent * 0.75 + trendBonus + seasonalityComponent + 12.5);
}

/** Empire-friendly competition score — inverts raw competition intensity. */
export function computeCompetitionScore(rawCompetition: number): number {
  return clamp(100 - rawCompetition);
}

/** Margin score from unit economics — purchase, sell, and ship costs only. */
export function computeMarginScore(
  purchasePriceCents: number,
  estimatedSellingPriceCents: number,
  shippingCostCents: number,
): number {
  if (estimatedSellingPriceCents <= 0) return 0;

  const totalCostCents = purchasePriceCents + shippingCostCents;
  const netMarginCents = estimatedSellingPriceCents - totalCostCents;
  const marginPct = (netMarginCents / estimatedSellingPriceCents) * 100;

  if (marginPct <= 0) return clamp(marginPct + 10, 0, 15);
  if (marginPct >= 70) return 95;
  if (marginPct >= 50) return clamp(70 + (marginPct - 50) * 1.25);
  if (marginPct >= 30) return clamp(45 + (marginPct - 30) * 1.25);
  return clamp(marginPct * 1.5);
}

/** Shipping score from cost ratio and supplier lead time — independent of margin math. */
export function computeShippingScore(
  shippingCostCents: number,
  estimatedSellingPriceCents: number,
  supplierData: ProductSupplierData,
): number {
  if (estimatedSellingPriceCents <= 0) return 0;

  const shippingRatio = shippingCostCents / estimatedSellingPriceCents;
  let ratioScore: number;
  if (shippingRatio <= 0.05) ratioScore = 92;
  else if (shippingRatio <= 0.1) ratioScore = 78;
  else if (shippingRatio <= 0.2) ratioScore = 58;
  else if (shippingRatio <= 0.35) ratioScore = 35;
  else ratioScore = 15;

  const shipDays = supplierData.avgShipDays;
  let leadTimeScore: number;
  if (shipDays <= 5) leadTimeScore = 95;
  else if (shipDays <= 10) leadTimeScore = 80;
  else if (shipDays <= 15) leadTimeScore = 62;
  else if (shipDays <= 21) leadTimeScore = 42;
  else leadTimeScore = 22;

  return clamp(ratioScore * 0.55 + leadTimeScore * 0.45);
}

/** Supplier reliability from catalog signals — defect rate adjusts base reliability. */
export function computeSupplierReliability(supplierData: ProductSupplierData): number {
  const base = clamp(supplierData.reliabilityScore);
  const defectPenalty = supplierData.defectRatePct
    ? Math.min(25, supplierData.defectRatePct * 2.5)
    : 0;
  const regionBonus = supplierData.region === "US" || supplierData.region === "EU" ? 5 : 0;

  return clamp(base - defectPenalty + regionBonus);
}

/** Compute all dimension scores independently before recommendation aggregation. */
export function computeAllScores(input: ProductIntelligenceInput): ProductIntelligenceScores {
  return {
    demandScore: computeDemandScore(input.historicalDemand),
    competitionScore: computeCompetitionScore(input.competitionScore),
    marginScore: computeMarginScore(
      input.purchasePriceCents,
      input.estimatedSellingPriceCents,
      input.shippingCostCents,
    ),
    shippingScore: computeShippingScore(
      input.shippingCostCents,
      input.estimatedSellingPriceCents,
      input.supplierData,
    ),
    supplierReliability: computeSupplierReliability(input.supplierData),
  };
}

/** Confidence from input completeness — no external API required. */
export function computeConfidence(input: ProductIntelligenceInput): number {
  let signals = 0;
  let present = 0;

  const checks: boolean[] = [
    input.productTitle.length > 0,
    input.category.length > 0,
    input.purchasePriceCents > 0,
    input.estimatedSellingPriceCents > 0,
    input.shippingCostCents >= 0,
    input.historicalDemand.searchVolumeIndex > 0,
    input.competitionScore >= 0,
    input.supplierData.reliabilityScore > 0,
    input.supplierData.name.length > 0,
    (input.historicalDemand.monthlyOrdersEstimate ?? 0) > 0,
    input.supplierData.defectRatePct !== undefined,
    input.historicalDemand.seasonalityIndex !== undefined,
  ];

  for (const check of checks) {
    signals += 1;
    if (check) present += 1;
  }

  const completeness = present / signals;
  return clamp(Math.round(completeness * 85 + 15));
}
