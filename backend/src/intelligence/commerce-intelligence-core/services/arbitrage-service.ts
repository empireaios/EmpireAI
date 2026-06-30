import type { ArbitrageAnalysis, MarketplaceStudy, ProductCandidate } from "../models/commerce-intelligence-core.js";

const MIN_NET_MARGIN_PERCENT = 18;

function clampPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Arbitrage analysis — rejects or defers products below margin thresholds. */
export function analyzeArbitrage(
  candidate: ProductCandidate,
  study: MarketplaceStudy,
): ArbitrageAnalysis {
  const supplierCostUsd = candidate.supplierCostUsd;
  const shippingCostUsd = Math.round((4.5 + candidate.supplierCostUsd * 0.08) * 100) / 100;
  const marketplaceFeesUsd = study.estimatedMarketplaceFeesUsd;
  const expectedSellingPriceUsd = study.competitorPriceRangeUsd.min;
  const paymentFeesUsd = Math.round(expectedSellingPriceUsd * 0.029 * 100) / 100;
  const advertisingAllowanceUsd = Math.round(expectedSellingPriceUsd * 0.12 * 100) / 100;

  const totalCost =
    supplierCostUsd + shippingCostUsd + marketplaceFeesUsd + paymentFeesUsd + advertisingAllowanceUsd;
  const grossProfit = expectedSellingPriceUsd - supplierCostUsd - shippingCostUsd;
  const netProfit = expectedSellingPriceUsd - totalCost;

  const estimatedGrossMarginPercent = clampPercent((grossProfit / expectedSellingPriceUsd) * 100);
  const estimatedNetMarginPercent = clampPercent((netProfit / expectedSellingPriceUsd) * 100);

  let downsideRisk: ArbitrageAnalysis["downsideRisk"] = "low";
  if (estimatedNetMarginPercent < 15 || candidate.inventoryTotal < 30) downsideRisk = "high";
  else if (estimatedNetMarginPercent < 22) downsideRisk = "medium";

  const passesThreshold = estimatedNetMarginPercent >= MIN_NET_MARGIN_PERCENT && candidate.inventoryTotal > 0;
  const arbitrageScore = clampPercent(
    estimatedNetMarginPercent * 2.5 + (passesThreshold ? 15 : 0) - (downsideRisk === "high" ? 20 : 0),
  );
  const launchBudgetEstimateUsd = Math.round(
    advertisingAllowanceUsd * 30 + expectedSellingPriceUsd * 2,
  );

  let rejectionReason: string | undefined;
  if (!passesThreshold) {
    if (candidate.inventoryTotal <= 0) rejectionReason = "Insufficient supplier inventory";
    else rejectionReason = `Net margin ${estimatedNetMarginPercent}% below ${MIN_NET_MARGIN_PERCENT}% threshold`;
  }

  return {
    supplierCostUsd,
    shippingCostUsd,
    marketplaceFeesUsd,
    paymentFeesUsd,
    advertisingAllowanceUsd,
    expectedSellingPriceUsd,
    estimatedGrossMarginPercent,
    estimatedNetMarginPercent,
    estimatedNetProfitUsd: Math.round(netProfit * 100) / 100,
    arbitrageScore,
    launchBudgetEstimateUsd,
    downsideRisk,
    passesThreshold,
    rejectionReason,
  };
}
