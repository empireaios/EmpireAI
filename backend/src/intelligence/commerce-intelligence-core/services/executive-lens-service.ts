import type {
  ArbitrageAnalysis,
  CtoLens,
  ExecutiveLens,
  MarketplaceStudy,
  ProductCandidate,
  ProductFitIntelligence,
} from "../models/commerce-intelligence-core.js";
import { hasCjCredentials, loadCjConfig } from "../../../suppliers/cj-dropshipping/cj-config.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return clampScore(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** CEO Lens — profit relevance, strategic fit, capital efficiency before Grand King review. */
export function applyCeoLens(
  candidate: ProductCandidate,
  study: MarketplaceStudy,
  arbitrage: ArbitrageAnalysis,
  fit: ProductFitIntelligence,
): ExecutiveLens {
  const profitRelevance = clampScore(arbitrage.estimatedNetMarginPercent * 3.5);
  const strategicFit = clampScore(study.categoryFitScore * 0.7 + fit.adFriendliness * 0.3);
  const capitalEfficiency = clampScore(
    100 - arbitrage.advertisingAllowanceUsd * 2 - (arbitrage.downsideRisk === "high" ? 25 : 0),
  );
  const simplicityOfDecision = clampScore(
    arbitrage.passesThreshold ? 80 : 35,
  );
  const attentionWorthiness = clampScore(
    profitRelevance * 0.35 + strategicFit * 0.25 + fit.visualAppeal * 0.2 + fit.impulsePotential * 0.2,
  );

  const overallScore = average([
    profitRelevance,
    strategicFit,
    capitalEfficiency,
    simplicityOfDecision,
    attentionWorthiness,
  ]);

  const evidence = [
    `Net margin ${arbitrage.estimatedNetMarginPercent}% · gross ${arbitrage.estimatedGrossMarginPercent}%`,
    `Category fit ${study.categoryFitScore}/100 on Amazon US`,
    `${fit.route} route — ${fit.routeRationale}`,
    `Downside risk: ${arbitrage.downsideRisk}`,
  ];

  const summary =
    overallScore >= 70
      ? "Strong profit relevance and strategic fit — worthy of Grand King review"
      : overallScore >= 55
        ? "Moderate opportunity — review margin and competition before approval"
        : "Below attention threshold — defer or reject unless strategic override";

  const passes = overallScore >= 55;

  return {
    profitRelevance,
    strategicFit,
    capitalEfficiency,
    simplicityOfDecision,
    attentionWorthiness,
    overallScore,
    passes,
    summary,
    evidence,
  };
}

/** CTO Lens — technical readiness for supplier, marketplace, publishing, and recovery. */
export function applyCtoLens(
  candidate: ProductCandidate,
  study: MarketplaceStudy,
  fit: ProductFitIntelligence,
): CtoLens {
  const cjConfig = loadCjConfig();
  const supplierConnectionReady = hasCjCredentials(cjConfig) || cjConfig.integrationMode === "SANDBOX";
  const marketplaceConnectionReady = true;
  const publishingTechnicallySupported =
    fit.route === "shopify" ? true : study.publishingReadinessScore >= 50;
  const inventorySyncReady = candidate.inventoryTotal > 0;
  const fulfillmentRouteReady = candidate.shippingCountries.includes("US");
  const recoveryPathAvailable = true;

  const checks = [
    supplierConnectionReady,
    marketplaceConnectionReady,
    publishingTechnicallySupported,
    inventorySyncReady,
    fulfillmentRouteReady,
    recoveryPathAvailable,
  ];
  const monitoringReady = inventorySyncReady && fulfillmentRouteReady && recoveryPathAvailable;
  const overallScore = clampScore((checks.filter(Boolean).length / checks.length) * 100);
  const passes = overallScore >= 60 && monitoringReady;

  const evidence = [
    `CJ supplier ${supplierConnectionReady ? "connected (sandbox or live)" : "needs credentials"}`,
    `Amazon US publishing readiness ${study.publishingReadinessScore}/100`,
    `Inventory sync: ${candidate.inventoryTotal} units across ${candidate.variants.length} variant(s)`,
    `Fulfillment to US: ${fulfillmentRouteReady ? "ready" : "blocked"}`,
    `Recovery path: manual defer + relaunch via Pillow mission queue`,
    `Monitoring readiness: ${monitoringReady ? "ready" : "blocked"}`,
  ];

  const summary =
    overallScore >= 80
      ? "Technical path clear — supplier, marketplace, and fulfillment routes supported"
      : overallScore >= 60
        ? "Partial readiness — resolve blockers before launch execution"
        : "Technical blockers present — do not approve launch until resolved";

  return {
    supplierConnectionReady,
    marketplaceConnectionReady,
    publishingTechnicallySupported,
    inventorySyncReady,
    fulfillmentRouteReady,
    recoveryPathAvailable,
    monitoringReady,
    overallScore,
    passes,
    summary,
    evidence,
  };
}
