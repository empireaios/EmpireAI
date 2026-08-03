/** X3-01 — Scaling metadata generator. */

import { ASF_METADATA_VERSION } from "./paths.js";
import type {
  AutonomousScalingFrameworkRecord,
  ScalingFrameworkRunReport,
  ScalingValidationReport,
} from "./types.js";

export function buildScalingFrameworkRunReportId(): string {
  return `asf-run-${Date.now()}`;
}

export class ScalingMetadataGenerator {
  buildRunReport(input: {
    action: ScalingFrameworkRunReport["action"];
    records: AutonomousScalingFrameworkRecord[];
    validation: ScalingValidationReport;
    durationMs: number;
  }): ScalingFrameworkRunReport {
    for (const record of input.records) {
      record.validationStatus =
        input.validation.decision === "fail"
          ? "fail"
          : input.validation.decision === "partial"
            ? "partial"
            : "pass";
    }

    return {
      scalingFrameworkRunReportId: buildScalingFrameworkRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ASF_METADATA_VERSION,
    };
  }
}
