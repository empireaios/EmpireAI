/** X4-02 — Market Analysis Engine (structural signals only). */

import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type { CountryEvaluationInput, CountryIntelligenceRecord } from "./types.js";
import { buildCountryRecord, computeStructuralSignals } from "./structural-signals.js";

export class MarketAnalysisEngine {
  analyze(
    input: CountryEvaluationInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CountryIntelligenceRecord {
    const signals = computeStructuralSignals(input, config);
    return buildCountryRecord(
      signals,
      `Market size and competitive landscape analyzed for ${signals.country} · marketSize=${signals.marketSizeScore}`,
    );
  }
}
