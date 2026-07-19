/** R2-13 — Return validation and metadata. */

import type {
  InvalidReturnFinding,
  ReturnFailureFinding,
  ReturnRecord,
  ReturnValidationReport,
} from "./types.js";
import type { ReturnManagementConfiguration } from "./configuration.js";
import { RM_METADATA_VERSION } from "./paths.js";
import { ReturnValidationEngine } from "./return-validation-engine.js";

export class ReturnValidator {
  private readonly validationEngine = new ReturnValidationEngine();

  validateReturnResult(input: {
    records: ReturnRecord[];
    failures: ReturnFailureFinding[];
    config: ReturnManagementConfiguration;
    startedAt: number;
  }): ReturnValidationReport {
    const { errors, warnings } = this.validationEngine.validateReturnRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} return failure(s) detected`);

    let decision: ReturnValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `rm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: RM_METADATA_VERSION,
    };
  }
}

export function buildReturnReportId(): string {
  return `rm-run-${Date.now()}`;
}

export class ReturnMetadataGenerator {
  generateReturnReport(input: {
    action: import("./types.js").ReturnReport["action"];
    records: ReturnRecord[];
    failures: ReturnFailureFinding[];
    invalidRecords: InvalidReturnFinding[];
    validation: ReturnValidationReport;
    durationMs: number;
  }): import("./types.js").ReturnReport {
    return {
      returnReportId: buildReturnReportId(),
      returnTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RM_METADATA_VERSION,
    };
  }
}

export { ReturnValidationEngine };
