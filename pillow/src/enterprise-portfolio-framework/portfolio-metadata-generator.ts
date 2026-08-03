/** X2-01 — Portfolio metadata generator. */

import { EPF_METADATA_VERSION } from "./paths.js";
import type {
  EnterprisePortfolioFrameworkRecord,
  PortfolioFrameworkRunReport,
  PortfolioValidationReport,
  RegisteredCompanyRef,
} from "./types.js";

export function buildPortfolioFrameworkRunReportId(): string {
  return `epf-run-${Date.now()}`;
}

export class PortfolioMetadataGenerator {
  buildRunReport(input: {
    action: PortfolioFrameworkRunReport["action"];
    records: EnterprisePortfolioFrameworkRecord[];
    companies?: RegisteredCompanyRef[];
    validation: PortfolioValidationReport;
    durationMs: number;
  }): PortfolioFrameworkRunReport {
    for (const record of input.records) {
      record.validationStatus =
        input.validation.decision === "fail"
          ? "fail"
          : input.validation.decision === "partial"
            ? "partial"
            : "pass";
    }

    return {
      portfolioFrameworkRunReportId: buildPortfolioFrameworkRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      companies: input.companies ?? [],
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EPF_METADATA_VERSION,
    };
  }
}
