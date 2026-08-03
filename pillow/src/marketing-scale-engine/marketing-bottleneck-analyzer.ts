/** X3-05 — Marketing Bottleneck Analyzer. */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MarketingScalingRecord } from "./types.js";

export class MarketingBottleneckAnalyzer {
  detect(
    records: MarketingScalingRecord[],
    config: MarketingScaleEngineConfiguration,
  ): MarketingScalingRecord[] {
    if (!config.bottleneckDetectionEnabled) return [];
    return records
      .filter(
        (r) =>
          r.customerAcquisitionCost > config.maxCacThreshold ||
          r.returnOnAdvertisingSpend < config.minRoasThreshold ||
          r.conversionPerformance < config.minConversionThreshold ||
          r.scalingReadinessScore < config.minScalingReadinessScore,
      )
      .map((r) => {
        let recommendationSummary = r.recommendationSummary;
        if (r.customerAcquisitionCost > config.maxCacThreshold) {
          recommendationSummary = `Critical CAC bottleneck · ${r.campaignReference} at CAC ${r.customerAcquisitionCost}`;
        } else if (r.returnOnAdvertisingSpend < config.minRoasThreshold) {
          recommendationSummary = `Critical ROAS bottleneck · ${r.campaignReference} at ROAS ${r.returnOnAdvertisingSpend}`;
        } else if (r.conversionPerformance < config.minConversionThreshold) {
          recommendationSummary = `Conversion bottleneck · ${r.campaignReference} at ${r.conversionPerformance}`;
        } else {
          recommendationSummary = `Readiness bottleneck · ${r.campaignReference} at ${r.scalingReadinessScore}`;
        }
        return {
          ...r,
          recommendationSummary,
          timestamp: new Date().toISOString(),
        };
      });
  }
}
