/** X4-05 — Regional Pricing Engine. */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import {
  buildCurrencyIntelligenceRecord,
  computeStructuralCurrencySignals,
} from "./structural-signals.js";
import type { CurrencyAnalysisInput, CurrencyIntelligenceRecord } from "./types.js";

export class RegionalPricingEngine {
  price(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyIntelligenceRecord {
    if (!config.regionalPricingRulesEnabled) {
      const signals = computeStructuralCurrencySignals(input, config);
      return buildCurrencyIntelligenceRecord(
        {
          ...signals,
          regionalPricingStatus: "disabled",
          recommendationSummary: `Regional pricing disabled for ${signals.currencyCode}`,
        },
        "partial",
      );
    }

    const signals = computeStructuralCurrencySignals(
      { ...input, exchangeDataValidated: true, validated: true },
      config,
    );
    const region = input.region?.trim() || "GLOBAL";
    return buildCurrencyIntelligenceRecord({
      ...signals,
      recommendationSummary: `Regional pricing for ${signals.currencyCode} in ${region} — status=${signals.regionalPricingStatus}`,
    });
  }
}
