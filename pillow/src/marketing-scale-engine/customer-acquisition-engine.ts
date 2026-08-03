/** X3-05 — Customer Acquisition Engine (CAC-focused). */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type { MarketingScaleInput, MarketingScalingRecord } from "./types.js";
import { buildMarketingScalingRecord, computeMarketingSignals } from "./structural-signals.js";

export class CustomerAcquisitionEngine {
  assess(
    input: MarketingScaleInput,
    config: MarketingScaleEngineConfiguration,
  ): MarketingScalingRecord {
    const signals = computeMarketingSignals(input.channel ?? "campaign", input, config);
    const summary =
      signals.customerAcquisitionCost > config.maxCacThreshold
        ? `CAC ${signals.customerAcquisitionCost} exceeds max ${config.maxCacThreshold} — hold acquisition spend`
        : `CAC ${signals.customerAcquisitionCost} within validated threshold — monitor efficiency`;
    return buildMarketingScalingRecord({
      ...signals,
      recommendationSummary: summary,
      config,
    });
  }
}
