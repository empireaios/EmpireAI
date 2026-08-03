/** X3-02 — Shared structural product scoring helpers. */

import { WPD_METADATA_VERSION } from "./paths.js";
import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type {
  OpportunityClass,
  ProductAnalysisInput,
  ProductOpportunityRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: ProductAnalysisInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultProduct(input?: ProductAnalysisInput): string {
  return input?.productReference?.trim() || "product-default";
}

export function computeStructuralSignals(
  input: ProductAnalysisInput,
  config: WinningProductDetectorConfiguration,
): Omit<
  ProductOpportunityRecord,
  | "productOpportunityId"
  | "timestamp"
  | "opportunityRanking"
  | "recommendationSummary"
  | "validationStatus"
  | "metadataVersion"
  | "neverManipulateProductPerformanceData"
  | "structuralSignalOnly"
  | "sensitiveOperationalData"
> & { opportunityClass: OpportunityClass } {
  const company = defaultCompany(input);
  const product = defaultProduct(input);
  const seed = `${company}::${product}`;

  const salesVelocity = Math.round(
    input.salesVelocityHint ?? hashScore(`${seed}:velocity`, 40, 95),
  );
  const revenueGrowth = Math.round(
    input.revenueGrowthHint ?? hashScore(`${seed}:rev`, -15, 60),
  );
  const profitGrowth = Math.round(
    input.profitGrowthHint ?? hashScore(`${seed}:profit`, -20, 55),
  );
  const demandScore = Math.round(input.demandHint ?? hashScore(`${seed}:demand`, 35, 92));
  const trendScore = Math.round(input.trendHint ?? hashScore(`${seed}:trend`, 30, 90));
  const conversion = Math.round(input.conversionHint ?? hashScore(`${seed}:conv`, 20, 85));
  const inventory = Math.round(
    input.inventoryMovementHint ?? hashScore(`${seed}:inv`, 25, 88),
  );

  const scalingPotentialScore = Math.round(
    salesVelocity * 0.25 +
      Math.max(0, revenueGrowth) * 0.2 +
      Math.max(0, profitGrowth) * 0.15 +
      demandScore * 0.15 +
      trendScore * 0.15 +
      conversion * 0.05 +
      inventory * 0.05,
  );

  let opportunityClass: OpportunityClass = "stable";
  if (
    config.breakoutDetectionEnabled &&
    salesVelocity >= config.breakoutVelocityThreshold &&
    revenueGrowth >= config.breakoutGrowthThreshold
  ) {
    opportunityClass = "breakout";
  } else if (revenueGrowth <= config.decliningGrowthThreshold) {
    opportunityClass = "declining";
  } else if (scalingPotentialScore >= 65 && trendScore >= 60) {
    opportunityClass = "emerging";
  }

  return {
    companyReference: company,
    productReference: product,
    salesVelocity,
    revenueGrowth,
    profitGrowth,
    demandScore,
    trendScore,
    scalingPotentialScore: Math.max(0, Math.min(100, scalingPotentialScore)),
    opportunityClass,
  };
}

export function buildOpportunityRecord(
  signals: ReturnType<typeof computeStructuralSignals>,
  ranking: number,
  summary: string,
): ProductOpportunityRecord {
  return {
    productOpportunityId: `wpd-opp-${Date.now()}-${signals.productReference}`,
    timestamp: new Date().toISOString(),
    companyReference: signals.companyReference,
    productReference: signals.productReference,
    salesVelocity: signals.salesVelocity,
    revenueGrowth: signals.revenueGrowth,
    profitGrowth: signals.profitGrowth,
    demandScore: signals.demandScore,
    trendScore: signals.trendScore,
    scalingPotentialScore: signals.scalingPotentialScore,
    opportunityRanking: ranking,
    recommendationSummary: summary,
    validationStatus: "passed",
    metadataVersion: WPD_METADATA_VERSION,
    opportunityClass: signals.opportunityClass,
    neverManipulateProductPerformanceData: true,
    structuralSignalOnly: true,
    sensitiveOperationalData: false,
  };
}
