/** X4-02 — Economic Intelligence Engine (structural signals only). */

import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type { CountryEvaluationInput, CountryIntelligenceRecord } from "./types.js";
import { buildCountryRecord, computeStructuralSignals } from "./structural-signals.js";

export class EconomicIntelligenceEngine {
  monitor(
    input: CountryEvaluationInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CountryIntelligenceRecord {
    const signals = computeStructuralSignals(input, config);
    return buildCountryRecord(
      signals,
      `Economic indicators monitored for ${signals.country} · economicScore=${signals.economicScore}`,
    );
  }
}
