/** R5-01 — Marketing metadata generator. */

import { MARKETING_METADATA_VERSION } from "./paths.js";
import type {
  MarketingFrameworkRecord,
  MarketingValidationReport,
  FrameworkRunReport,
} from "./types.js";

export function buildFrameworkId(marketingModuleIdentifier: string): string {
  return `mfw-${marketingModuleIdentifier}-${Date.now()}`;
}

export function buildFrameworkRunReportId(): string {
  return `mfw-run-${Date.now()}`;
}

export class MarketingMetadataGenerator {
  buildRunReport(input: {
    action: FrameworkRunReport["action"];
    records: MarketingFrameworkRecord[];
    validation: MarketingValidationReport;
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
      metadataVersion: MARKETING_METADATA_VERSION,
    };
  }
}
