/** R2-18 — SLA validation and metadata. */

import type {
  InvalidSlaFinding,
  SlaFailureFinding,
  SlaRecord,
  SlaValidationReport,
} from "./types.js";
import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import { FSM_METADATA_VERSION } from "./paths.js";

export class SlaValidationEngine {
  detectInvalidOrder(orderReference: string, complianceScore: number): InvalidSlaFinding | null {
    const errors: string[] = [];
    if (!orderReference) errors.push("Missing order reference");
    if (complianceScore < 0 || complianceScore > 100) errors.push("Invalid compliance score");
    if (errors.length) return { orderReference: orderReference || "unknown", errors };
    return null;
  }

  validateSlaRecords(
    records: SlaRecord[],
    config: FulfilmentSlaMonitorConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.slaRecordId)) {
        errors.push(`Duplicate SLA record: ${record.slaRecordId}`);
      }
      seen.add(record.slaRecordId);
      if (!record.slaRecordId.startsWith("fsm-")) {
        errors.push(`Invalid SLA record ID prefix: ${record.slaRecordId}`);
      }
      if (record.slaTarget <= 0) errors.push(`Invalid SLA target for ${record.orderReference}`);
    }
    return { errors, warnings };
  }
}

export class SlaValidator {
  private readonly validationEngine = new SlaValidationEngine();

  validateSlaResult(input: {
    records: SlaRecord[];
    failures: SlaFailureFinding[];
    config: FulfilmentSlaMonitorConfiguration;
    startedAt: number;
  }): SlaValidationReport {
    const { errors, warnings } = this.validationEngine.validateSlaRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} monitoring failure(s) detected`);

    let decision: SlaValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `fsm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: FSM_METADATA_VERSION,
    };
  }
}

export function buildSlaReportId(): string {
  return `fsm-run-${Date.now()}`;
}

export class SlaMetadataGenerator {
  generateSlaReport(input: {
    action: import("./types.js").SlaReport["action"];
    records: SlaRecord[];
    history: import("./types.js").SlaHistoryEntry[];
    failures: SlaFailureFinding[];
    invalidRecords: InvalidSlaFinding[];
    validation: SlaValidationReport;
    durationMs: number;
  }): import("./types.js").SlaReport {
    return {
      slaReportId: buildSlaReportId(),
      slaTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      history: input.history,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: FSM_METADATA_VERSION,
    };
  }
}
