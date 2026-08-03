/** X4-07 — Tax Compliance Engine. */

import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import {
  buildTaxIntelligenceRecord,
  computeStructuralTaxSignals,
} from "./structural-signals.js";
import type { TaxAnalysisInput, TaxIntelligenceRecord } from "./types.js";

export class TaxComplianceEngine {
  assessCompliance(
    input: TaxAnalysisInput,
    config: GlobalTaxIntelligenceConfiguration,
  ): TaxIntelligenceRecord {
    const signals = computeStructuralTaxSignals(input, config);
    return buildTaxIntelligenceRecord(
      {
        ...signals,
        recommendationSummary: `Tax compliance posture ${signals.complianceStatus} for ${signals.country}/${signals.taxCategory} — not legal advice`,
      },
      signals.complianceStatus === "unknown" ? "partial" : "passed",
    );
  }
}
