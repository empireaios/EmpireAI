/** X4-07 — Tax Calculation Engine. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import {
  buildTaxIntelligenceRecord,
  computeStructuralTaxSignals,
} from "./structural-signals.js";
import type { TaxAnalysisInput, TaxIntelligenceRecord } from "./types.js";

export class TaxCalculationEngine {
  estimateTaxObligation(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    if (!config.taxCalculationRulesEnabled) {
      throw new Error("Tax calculation rules disabled");
    }
    const signals = computeStructuralTaxSignals(
      { ...input, taxCategory: "obligation_estimate" },
      config,
    );
    return buildTaxIntelligenceRecord(
      {
        ...signals,
        recommendationSummary: `Structural obligation estimate for ${signals.country} (units=${signals.estimatedTaxObligation}) — not authoritative legal advice`,
      },
      input.validated === true ? "passed" : "failed",
    );
  }
}
