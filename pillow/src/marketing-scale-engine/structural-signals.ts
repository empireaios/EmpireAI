/** X3-05 — Shared structural marketing scaling helpers. */

import { MSE_METADATA_VERSION } from "./paths.js";
import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type {
  MarketingChannel,
  MarketingScaleInput,
  MarketingScalingRecord,
} from "./types.js";

function hashScore(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const span = max - min;
  return min + (h % (span + 1));
}

export function defaultCompany(input?: MarketingScaleInput): string {
  return input?.companyReference?.trim() || "company-default";
}

export function defaultCampaign(input?: MarketingScaleInput): string {
  return input?.campaignReference?.trim() || "campaign-default";
}

export function buildMarketingScalingRecord(input: {
  companyReference: string;
  campaignReference: string;
  customerAcquisitionCost: number;
  returnOnAdvertisingSpend: number;
  conversionPerformance: number;
  scalingReadinessScore: number;
  recommendationSummary: string;
  config: MarketingScaleEngineConfiguration;
}): MarketingScalingRecord {
  let readiness = Math.max(0, Math.min(100, Math.round(input.scalingReadinessScore)));
  if (input.config.neverRecommendMarketingExpansionWithoutValidatedPerformance) {
    if (
      input.customerAcquisitionCost > input.config.maxCacThreshold ||
      input.returnOnAdvertisingSpend < input.config.minRoasThreshold ||
      input.conversionPerformance < input.config.minConversionThreshold
    ) {
      readiness = Math.min(readiness, input.config.minScalingReadinessScore - 1);
    }
  }

  return {
    marketingScalingId: `mse-mkt-${Date.now()}-${input.campaignReference}`,
    timestamp: new Date().toISOString(),
    companyReference: input.companyReference,
    campaignReference: input.campaignReference,
    customerAcquisitionCost: Math.max(
      5,
      Math.min(80, Math.round(input.customerAcquisitionCost)),
    ),
    returnOnAdvertisingSpend: Math.max(
      50,
      Math.min(400, Math.round(input.returnOnAdvertisingSpend)),
    ),
    conversionPerformance: Math.max(
      0,
      Math.min(100, Math.round(input.conversionPerformance)),
    ),
    scalingReadinessScore: readiness,
    recommendationSummary: input.recommendationSummary,
    validationStatus: "passed",
    metadataVersion: MSE_METADATA_VERSION,
    neverRecommendMarketingExpansionWithoutValidatedPerformance: true,
    structuralSignalOnly: true,
    sensitiveMarketingData: false,
  };
}

export function computeMarketingSignals(
  channelOrCampaign: MarketingChannel | "campaign",
  input: MarketingScaleInput,
  config: MarketingScaleEngineConfiguration,
): {
  companyReference: string;
  campaignReference: string;
  customerAcquisitionCost: number;
  returnOnAdvertisingSpend: number;
  conversionPerformance: number;
  scalingReadinessScore: number;
  recommendationSummary: string;
} {
  const company = defaultCompany(input);
  const campaign = defaultCampaign(input);
  const seed = `${company}::${campaign}::${channelOrCampaign}`;

  const customerAcquisitionCost = Math.round(
    input.cacHint ?? hashScore(`${seed}:cac`, 10, 80),
  );
  const returnOnAdvertisingSpend = Math.round(
    input.roasHint ?? hashScore(`${seed}:roas`, 50, 400),
  );
  const conversionPerformance = Math.round(
    input.conversionHint ?? hashScore(`${seed}:conversion`, 0, 100),
  );

  // Lower CAC is better — invert into a contribution toward readiness.
  const cacScore = Math.max(0, Math.min(100, Math.round(100 - customerAcquisitionCost)));
  const roasScore = Math.max(
    0,
    Math.min(100, Math.round((returnOnAdvertisingSpend / 400) * 100)),
  );
  const conversionScore = Math.max(0, Math.min(100, conversionPerformance));
  let scalingReadinessScore = Math.round(
    input.readinessHint ?? (cacScore * 0.35 + roasScore * 0.4 + conversionScore * 0.25),
  );

  let recommendationSummary = "Marketing performance within validated structural bounds";
  if (customerAcquisitionCost > config.maxCacThreshold) {
    recommendationSummary = `CAC bottleneck at ${customerAcquisitionCost} (max ${config.maxCacThreshold}) — do not expand`;
  } else if (returnOnAdvertisingSpend < config.minRoasThreshold) {
    recommendationSummary = `ROAS bottleneck at ${returnOnAdvertisingSpend} (min ${config.minRoasThreshold}) — do not expand`;
  } else if (conversionPerformance < config.minConversionThreshold) {
    recommendationSummary = `Conversion bottleneck at ${conversionPerformance} (min ${config.minConversionThreshold}) — do not expand`;
  } else if (scalingReadinessScore < config.minScalingReadinessScore) {
    recommendationSummary = `Readiness ${scalingReadinessScore} below min ${config.minScalingReadinessScore} — hold scale`;
  } else {
    recommendationSummary = `Validated ${channelOrCampaign} performance supports cautious marketing scale`;
  }

  if (config.neverRecommendMarketingExpansionWithoutValidatedPerformance) {
    if (
      customerAcquisitionCost > config.maxCacThreshold ||
      returnOnAdvertisingSpend < config.minRoasThreshold ||
      conversionPerformance < config.minConversionThreshold
    ) {
      scalingReadinessScore = Math.min(
        scalingReadinessScore,
        config.minScalingReadinessScore - 1,
      );
    }
  }

  return {
    companyReference: company,
    campaignReference: campaign,
    customerAcquisitionCost,
    returnOnAdvertisingSpend,
    conversionPerformance,
    scalingReadinessScore,
    recommendationSummary,
  };
}
