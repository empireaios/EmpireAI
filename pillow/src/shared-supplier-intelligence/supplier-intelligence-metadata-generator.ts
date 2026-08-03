/** X2-13 — Supplier Intelligence Metadata Generator. */

import { SSI_METADATA_VERSION } from "./paths.js";
import type {
  SupplierIntelligenceEngineRecord,
  SupplierIntelligenceRecommendation,
  SupplierIntelligenceRecord,
  SupplierIntelligenceRunReport,
  SupplierIntelligenceValidationReport,
  SupplierRiskSignal,
} from "./types.js";

export function buildSupplierIntelligenceRunReportId(): string {
  return `ssi-run-${Date.now()}`;
}

export class SupplierIntelligenceMetadataGenerator {
  buildRunReport(input: {
    action: SupplierIntelligenceRunReport["action"];
    engineRecord: SupplierIntelligenceEngineRecord;
    intelligenceRecords?: SupplierIntelligenceRecord[];
    riskSignals?: SupplierRiskSignal[];
    recommendations?: SupplierIntelligenceRecommendation[];
    validation: SupplierIntelligenceValidationReport;
    durationMs: number;
  }): SupplierIntelligenceRunReport {
    return {
      supplierIntelligenceRunReportId: buildSupplierIntelligenceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      intelligenceRecords: input.intelligenceRecords ?? [],
      riskSignals: input.riskSignals ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SSI_METADATA_VERSION,
    };
  }
}
