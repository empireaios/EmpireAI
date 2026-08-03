/** X4-03 — Localization Metadata Generator. */

import { LOC_METADATA_VERSION } from "./paths.js";
import type {
  LocRunReport,
  LocalizationEngineRecord,
  LocalizationRecord,
  LocalizationRecommendation,
  LocalizationValidationReport,
} from "./types.js";

export class LocalizationMetadataGenerator {
  buildRunReport(input: {
    action: LocRunReport["action"];
    engineRecord: LocalizationEngineRecord;
    localizationRecords?: LocalizationRecord[];
    recommendations?: LocalizationRecommendation[];
    validation: LocalizationValidationReport;
    durationMs: number;
  }): LocRunReport {
    return {
      localizationRunReportId: `loc-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      localizationRecords: input.localizationRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: LOC_METADATA_VERSION,
    };
  }
}
