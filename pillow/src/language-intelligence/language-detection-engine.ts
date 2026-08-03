/** X4-04 — Language Detection Engine. */

import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import {
  buildLanguageIntelligenceRecord,
  computeStructuralLanguageSignals,
} from "./structural-signals.js";
import type { LanguageAnalysisInput, LanguageIntelligenceRecord } from "./types.js";

export class LanguageDetectionEngine {
  detect(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LanguageIntelligenceRecord {
    const signals = computeStructuralLanguageSignals(input, config);
    return buildLanguageIntelligenceRecord({
      ...signals,
      recommendationSummary: `Detected language preference ${signals.language} (confidence=${signals.detectedPreferenceConfidence}) for ${signals.companyReference}`,
    });
  }
}
