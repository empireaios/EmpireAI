/** X4-02 — Country Evaluation Engine. */

import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type { CountryEvaluationInput, CountryIntelligenceRecord } from "./types.js";
import { buildCountryRecord, computeStructuralSignals } from "./structural-signals.js";

export class CountryEvaluationEngine {
  evaluate(
    input: CountryEvaluationInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CountryIntelligenceRecord {
    const signals = computeStructuralSignals(input, config);
    return buildCountryRecord(
      signals,
      `Structural country evaluation for ${signals.country} · priority=${signals.expansionPriority}`,
    );
  }
}
