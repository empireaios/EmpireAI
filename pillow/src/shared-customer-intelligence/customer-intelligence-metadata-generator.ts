/** X2-12 — Customer Intelligence Metadata Generator. */

import { SCI_METADATA_VERSION } from "./paths.js";
import type {
  CustomerIntelligenceEngineRecord,
  CustomerIntelligenceRecommendation,
  CustomerIntelligenceRecord,
  CustomerIntelligenceRunReport,
  CustomerIntelligenceValidationReport,
  CustomerRiskSignal,
} from "./types.js";

export function buildCustomerIntelligenceRunReportId(): string {
  return `sci-run-${Date.now()}`;
}

export class CustomerIntelligenceMetadataGenerator {
  buildRunReport(input: {
    action: CustomerIntelligenceRunReport["action"];
    engineRecord: CustomerIntelligenceEngineRecord;
    intelligenceRecords?: CustomerIntelligenceRecord[];
    riskSignals?: CustomerRiskSignal[];
    recommendations?: CustomerIntelligenceRecommendation[];
    validation: CustomerIntelligenceValidationReport;
    durationMs: number;
  }): CustomerIntelligenceRunReport {
    return {
      customerIntelligenceRunReportId: buildCustomerIntelligenceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      intelligenceRecords: input.intelligenceRecords ?? [],
      riskSignals: input.riskSignals ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SCI_METADATA_VERSION,
    };
  }
}
