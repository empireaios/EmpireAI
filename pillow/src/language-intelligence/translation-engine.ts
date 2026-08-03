/** X4-04 — Translation Engine (structural signals; never overwrites canonical source). */

import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import {
  buildLanguageIntelligenceRecord,
  computeStructuralLanguageSignals,
} from "./structural-signals.js";
import type {
  LanguageAnalysisInput,
  LanguageIntelligenceRecord,
  TranslationCategory,
} from "./types.js";

export class TranslationEngine {
  translate(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
    category: TranslationCategory,
  ): LanguageIntelligenceRecord {
    const signals = computeStructuralLanguageSignals(
      { ...input, translationCategory: category },
      config,
    );
    return buildLanguageIntelligenceRecord({
      ...signals,
      recommendationSummary: `Structural translation plan for ${category} → ${signals.language} (quality=${signals.translationQualityScore}); canonical source not overwritten`,
    });
  }
}
