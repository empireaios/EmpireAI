/** X4-01 — Scaling metadata generator. */

import { GEF_METADATA_VERSION } from "./paths.js";
import type {
  GlobalExpansionFrameworkRecord,
  ExpansionFrameworkRunReport,
  ExpansionValidationReport,
} from "./types.js";

export function buildExpansionFrameworkRunReportId(): string {
  return `gef-run-${Date.now()}`;
}

export class GlobalMetadataGenerator {
  buildRunReport(input: {
    action: ExpansionFrameworkRunReport["action"];
    records: GlobalExpansionFrameworkRecord[];
    validation: ExpansionValidationReport;
    durationMs: number;
  }): ExpansionFrameworkRunReport {
    for (const record of input.records) {
      record.validationStatus =
        input.validation.decision === "fail"
          ? "fail"
          : input.validation.decision === "partial"
            ? "partial"
            : "pass";
    }

    return {
      expansionFrameworkRunReportId: buildExpansionFrameworkRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: GEF_METADATA_VERSION,
    };
  }
}
