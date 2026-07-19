/** X1-01 — Marketing metadata generator. */

import { COMPANY_FACTORY_METADATA_VERSION } from "./paths.js";
import type {
  CompanyFactoryFrameworkRecord,
  CompanyValidationReport,
  FrameworkRunReport,
} from "./types.js";

export function buildFrameworkId(companyModuleIdentifier: string): string {
  return `cff-${companyModuleIdentifier}-${Date.now()}`;
}

export function buildFrameworkRunReportId(): string {
  return `cff-run-${Date.now()}`;
}

export class CompanyMetadataGenerator {
  buildRunReport(input: {
    action: FrameworkRunReport["action"];
    records: CompanyFactoryFrameworkRecord[];
    validation: CompanyValidationReport;
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
      metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
    };
  }
}
