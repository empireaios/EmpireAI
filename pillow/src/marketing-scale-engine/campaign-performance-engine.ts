/** X3-05 — Campaign Performance Engine. */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MarketingScaleInput, MarketingScalingRecord } from "./types.js";
import { buildMarketingScalingRecord, computeMarketingSignals } from "./structural-signals.js";

export class CampaignPerformanceEngine {
  assess(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MarketingScalingRecord {
    const signals = computeMarketingSignals(input.channel ?? "campaign", input, config);
    return buildMarketingScalingRecord({ ...signals, config });
  }
}
