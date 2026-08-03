/** X4-04 — Language Metadata Generator. */

import { LI_METADATA_VERSION } from "./paths.js";
import type {
  LanguageIntelligenceEngineRecord,
  LanguageIntelligenceRecord,
  LanguageRecommendation,
  LanguageValidationReport,
  LiRunReport,
} from "./types.js";

export class LanguageMetadataGenerator {
  buildRunReport(input: {
    action: LiRunReport["action"];
    engineRecord: LanguageIntelligenceEngineRecord;
    languageRecords?: LanguageIntelligenceRecord[];
    recommendations?: LanguageRecommendation[];
    validation: LanguageValidationReport;
    durationMs: number;
  }): LiRunReport {
    return {
      languageRunReportId: `li-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      languageRecords: input.languageRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LI_METADATA_VERSION,
    };
  }
}
