/** X4-05 — Currency Analytics Engine (anomaly detection). */

import type { CurrencyIntelligenceConfiguration } from "./configuration.js";
import {
  buildCurrencyIntelligenceRecord,
  computeStructuralCurrencySignals,
} from "./structural-signals.js";
import type { CurrencyAnalysisInput, CurrencyIntelligenceRecord } from "./types.js";

export class CurrencyAnalyticsEngine {
  detectAnomalies(
    input: CurrencyAnalysisInput,
    config: CurrencyIntelligenceConfiguration,
  ): CurrencyIntelligenceRecord {
    const signals = computeStructuralCurrencySignals(input, config);
    const isAnomaly = signals.anomalyScore >= 60;
    return buildCurrencyIntelligenceRecord(
      {
        ...signals,
        regionalPricingStatus: isAnomaly ? "anomaly" : signals.regionalPricingStatus,
        recommendationSummary: isAnomaly
          ? `Currency anomaly detected for ${signals.currencyCode}: score=${signals.anomalyScore}`
          : `No material anomaly for ${signals.currencyCode}: score=${signals.anomalyScore}`,
      },
      isAnomaly ? "partial" : "passed",
    );
  }

  filterAnomalies(records: CurrencyIntelligenceRecord[]): CurrencyIntelligenceRecord[] {
    return records.filter(
      (r) => r.anomalyScore >= 60 || r.regionalPricingStatus === "anomaly",
    );
  }
}
