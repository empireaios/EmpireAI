/** R2-09 — Procurement Validator. */

import type {
  ProcurementFailureFinding,
  ProcurementRecord,
  ProcurementValidationReport,
} from "./types.js";
import type { ProcurementEngineConfiguration } from "./configuration.js";
import { PCE_METADATA_VERSION } from "./paths.js";
import { ProcurementValidationEngine } from "./procurement-validation-engine.js";

export class ProcurementValidator {
  private readonly validationEngine = new ProcurementValidationEngine();

  validateProcurementResult(input: {
    records: ProcurementRecord[];
    failures: ProcurementFailureFinding[];
    config: ProcurementEngineConfiguration;
    startedAt: number;
  }): ProcurementValidationReport {
    const { errors, warnings } = this.validationEngine.validateProcurementRecords(
      input.records,
      input.config,
    );

    if (input.failures.length) {
      warnings.push(`${input.failures.length} procurement failure(s) detected`);
    }

    let decision: ProcurementValidationReport["decision"] = "pass";
    if (errors.length) {
      decision = warnings.length ? "partial" : "fail";
    } else if (warnings.length) {
      decision = "partial";
    }

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass"
          ? ("passed" as const)
          : decision === "partial"
            ? ("partial" as const)
            : ("failed" as const),
    }));

    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `pce-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: PCE_METADATA_VERSION,
    };
  }
}
