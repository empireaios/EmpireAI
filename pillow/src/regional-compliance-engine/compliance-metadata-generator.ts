/** X4-06 — Compliance Metadata Generator. */

import { RCE_METADATA_VERSION } from "./paths.js";
import type {
  ComplianceRecommendation,
  ComplianceRecord,
  ComplianceValidationReport,
  RegionalComplianceEngineRecord,
  RceRunReport,
} from "./types.js";

export class ComplianceMetadataGenerator {
  buildRunReport(input: {
    action: RceRunReport["action"];
    engineRecord: RegionalComplianceEngineRecord;
    complianceRecords?: ComplianceRecord[];
    recommendations?: ComplianceRecommendation[];
    validation: ComplianceValidationReport;
    durationMs: number;
  }): RceRunReport {
    return {
      complianceRunReportId: `rce-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      complianceRecords: input.complianceRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RCE_METADATA_VERSION,
    };
  }
}
