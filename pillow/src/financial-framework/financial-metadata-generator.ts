/** R3-01 — Financial metadata generator. */

import { FINANCIAL_METADATA_VERSION } from "./paths.js";
import type {
  FinancialFrameworkRecord,
  FinancialValidationReport,
  FrameworkRunReport,
} from "./types.js";

export function buildFrameworkId(financialModuleIdentifier: string): string {
  return `ff-${financialModuleIdentifier}-${Date.now()}`;
}

export function buildFrameworkRunReportId(): string {
  return `ff-run-${Date.now()}`;
}

export class FinancialMetadataGenerator {
  buildRunReport(input: {
    action: FrameworkRunReport["action"];
    records: FinancialFrameworkRecord[];
    validation: FinancialValidationReport;
    durationMs: number;
  }): FrameworkRunReport {
    for (const record of input.records) {
      record.validationStatus =
        input.validation.decision === "fail"
          ? "fail"
          : input.validation.decision === "partial"
            ? "partial"
            : "pass";
    }

    return {
      frameworkRunReportId: buildFrameworkRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FINANCIAL_METADATA_VERSION,
    };
  }
}
