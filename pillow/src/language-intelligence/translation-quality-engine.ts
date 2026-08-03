/** X4-04 — Translation Quality Engine. */

import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import {
  buildLanguageIntelligenceRecord,
  computeStructuralLanguageSignals,
} from "./structural-signals.js";
import type { LanguageAnalysisInput, LanguageIntelligenceRecord } from "./types.js";

export class TranslationQualityEngine {
  analyze(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LanguageIntelligenceRecord {
    const signals = computeStructuralLanguageSignals(input, config);
    const belowThreshold = signals.translationQualityScore < config.qualityThreshold;
    return buildLanguageIntelligenceRecord(
      {
        ...signals,
        recommendationSummary: belowThreshold
          ? `Quality issue detected for ${signals.language}/${signals.translationCategory}: score=${signals.translationQualityScore} < threshold=${config.qualityThreshold}`
          : `Quality acceptable for ${signals.language}/${signals.translationCategory}: score=${signals.translationQualityScore}`,
      },
      belowThreshold ? "partial" : "passed",
    );
  }

  detectUnsupported(
    records: LanguageIntelligenceRecord[],
  ): LanguageIntelligenceRecord[] {
    return records
      .filter((r) => r.supportedLanguageStatus === "unsupported")
      .map((r) => ({
        ...r,
        recommendationSummary: `Unsupported language request: ${r.language} (${r.translationCategory})`,
      }));
  }
}
