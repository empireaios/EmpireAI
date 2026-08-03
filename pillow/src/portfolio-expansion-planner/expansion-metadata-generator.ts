/** X2-18 — Expansion Metadata Generator. */

import { PEP_METADATA_VERSION } from "./paths.js";
import type {
  ExpansionRecommendation,
  ExpansionRecord,
  ExpansionRunReport,
  ExpansionValidationReport,
  PortfolioExpansionEngineRecord,
} from "./types.js";

export function buildExpansionRunReportId(): string {
  return `pep-run-${Date.now()}`;
}

export class ExpansionMetadataGenerator {
  buildRunReport(input: {
    action: ExpansionRunReport["action"];
    engineRecord: PortfolioExpansionEngineRecord;
    expansionRecords?: ExpansionRecord[];
    recommendations?: ExpansionRecommendation[];
    validation: ExpansionValidationReport;
    durationMs: number;
  }): ExpansionRunReport {
    return {
      expansionRunReportId: buildExpansionRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      expansionRecords: input.expansionRecords ?? [],
      recommendations: input.recommendations ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PEP_METADATA_VERSION,
    };
  }
}
