/** X4-05 — Currency Management Engine. */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import {
  buildCurrencyIntelligenceRecord,
  computeStructuralCurrencySignals,
  normalizeCurrency,
} from "./structural-signals.js";
import type { CurrencyAnalysisInput, CurrencyIntelligenceRecord } from "./types.js";

export class CurrencyManagementEngine {
  manageSupported(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyIntelligenceRecord[] {
    return config.supportedCurrencies.map((code) => {
      const signals = computeStructuralCurrencySignals(
        { ...input, currencyCode: code, validated: true, exchangeDataValidated: true },
        config,
      );
      return buildCurrencyIntelligenceRecord({
        ...signals,
        recommendationSummary: `Managed supported currency ${normalizeCurrency(code)}`,
      });
    });
  }

  detectPreference(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyIntelligenceRecord {
    const signals = computeStructuralCurrencySignals(input, config);
    return buildCurrencyIntelligenceRecord({
      ...signals,
      recommendationSummary: `Detected customer currency preference ${signals.currencyCode} (confidence=${signals.preferenceConfidence})`,
    });
  }
}
