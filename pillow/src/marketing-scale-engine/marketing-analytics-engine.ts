/** X3-05 — Marketing Analytics Engine (ROAS / conversion). */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MarketingScaleInput, MarketingScalingRecord } from "./types.js";
import { buildMarketingScalingRecord, computeMarketingSignals } from "./structural-signals.js";

export class MarketingAnalyticsEngine {
  assess(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MarketingScalingRecord {
    const signals = computeMarketingSignals(input.channel ?? "campaign", input, config);
    let summary = signals.recommendationSummary;
    if (signals.returnOnAdvertisingSpend < config.minRoasThreshold) {
      summary = `ROAS ${signals.returnOnAdvertisingSpend} below min ${config.minRoasThreshold} — do not expand spend`;
    } else if (signals.conversionPerformance < config.minConversionThreshold) {
      summary = `Conversion ${signals.conversionPerformance} below min ${config.minConversionThreshold} — optimize funnel first`;
    } else {
      summary = `ROAS ${signals.returnOnAdvertisingSpend} · conversion ${signals.conversionPerformance} within validated analytics bounds`;
    }
    return buildMarketingScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
