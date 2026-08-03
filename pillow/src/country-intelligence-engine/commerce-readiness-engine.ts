/** X4-02 — Commerce Readiness Engine (structural signals only). */

import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type { CountryEvaluationInput, CountryIntelligenceRecord } from "./types.js";
import { buildCountryRecord, computeStructuralSignals } from "./structural-signals.js";

export class CommerceReadinessEngine {
  assess(
    input: CountryEvaluationInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CountryIntelligenceRecord {
    const signals = computeStructuralSignals(input, config);
    return buildCountryRecord(
      signals,
      `Digital commerce readiness assessed for ${signals.country} · readiness=${signals.commerceReadinessScore}`,
    );
  }
}
