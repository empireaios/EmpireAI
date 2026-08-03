/** X4-04 — Terminology Management Engine. */

import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import {
  buildLanguageIntelligenceRecord,
  computeStructuralLanguageSignals,
} from "./structural-signals.js";
import type { LanguageAnalysisInput, LanguageIntelligenceRecord } from "./types.js";

export class TerminologyManagementEngine {
  maintain(
    input: LanguageAnalysisInput,
    config: LanguageIntelligenceConfiguration,
  ): LanguageIntelligenceRecord {
    const signals = computeStructuralLanguageSignals(
      { ...input, translationCategory: "terminology" },
      config,
    );
    return buildLanguageIntelligenceRecord({
      ...signals,
      recommendationSummary: `Terminology consistency for ${signals.language}: score=${signals.terminologyConsistencyScore}; glossary preserved against canonical source`,
    });
  }
}
