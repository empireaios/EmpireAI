import { EIF_METADATA_VERSION } from "./paths.js";
import type { EmpireIntelligenceFrameworkRecord, EmpireIntelligenceFrameworkRunReport, EmpireIntelligenceValidationReport } from "./types.js";
export class EmpireMetadataGenerator {
  buildRunReport(action: string, records: EmpireIntelligenceFrameworkRecord[], validation: EmpireIntelligenceValidationReport, durationMs: number): EmpireIntelligenceFrameworkRunReport {
    return { frameworkRunReportId: `eif-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, records,
      validation, durationMs, metadataVersion: EIF_METADATA_VERSION };
  }
}
