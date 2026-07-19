/** R2-10 — Fulfilment validation (engine + validator). */

import type {
  FulfilmentFailureFinding,
  FulfilmentRecord,
  FulfilmentValidationReport,
  InvalidFulfilmentFinding,
  RouteFulfilmentInput,
} from "./types.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";
import { FO_METADATA_VERSION } from "./paths.js";

export class FulfilmentValidationEngine {
  detectInvalidRequest(input: RouteFulfilmentInput): InvalidFulfilmentFinding | null {
    const orderRef = input.orderReference ?? "";
    const errors: string[] = [];

    if (!input.procurementReference && input.includeFixtureFulfilment === false) {
      errors.push("Missing procurement reference");
    }

    if (errors.length) {
      return { orderReference: orderRef || "unknown", errors };
    }
    return null;
  }

  validateFulfilmentRecords(
    records: FulfilmentRecord[],
    config: FulfilmentOrchestratorConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.validationRulesEnabled) {
      return { errors, warnings };
    }

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.fulfilmentId)) {
        errors.push(`Duplicate fulfilment ID: ${record.fulfilmentId}`);
      }
      seen.add(record.fulfilmentId);

      if (!record.fulfilmentId.startsWith("fo-")) {
        errors.push(`Invalid fulfilment ID prefix: ${record.fulfilmentId}`);
      }
      if (record.quantity <= 0) {
        errors.push(`Invalid quantity for ${record.fulfilmentId}`);
      }
      if (record.failureStatus !== "none" && record.fulfilmentStatus === "fulfilled") {
        warnings.push(`Fulfilled record ${record.fulfilmentId} has failure status`);
      }
    }

    return { errors, warnings };
  }
}

export class FulfilmentValidator {
  private readonly validationEngine = new FulfilmentValidationEngine();

  validateFulfilmentResult(input: {
    records: FulfilmentRecord[];
    failures: FulfilmentFailureFinding[];
    config: FulfilmentOrchestratorConfiguration;
    startedAt: number;
  }): FulfilmentValidationReport {
    const { errors, warnings } = this.validationEngine.validateFulfilmentRecords(
      input.records,
      input.config,
    );

    const blocked = input.failures.filter((f) => f.failureType === "workflow_blocked");
    if (blocked.length) {
      warnings.push(`${blocked.length} blocked fulfilment workflow(s) detected`);
    }

    let decision: FulfilmentValidationReport["decision"] = "pass";
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
      validationReportId: `fo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: FO_METADATA_VERSION,
    };
  }
}
