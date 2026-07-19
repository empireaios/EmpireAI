/** R2-16 — Supplier risk validation and metadata. */

import type {
  InvalidSupplierRiskFinding,
  SupplierRiskFailureFinding,
  SupplierRiskRecord,
  SupplierRiskValidationReport,
} from "./types.js";
import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import { SRM_METADATA_VERSION } from "./paths.js";

export class SupplierRiskValidationEngine {
  detectInvalidSupplier(supplierId: string, riskScore: number): InvalidSupplierRiskFinding | null {
    const errors: string[] = [];
    if (!supplierId) errors.push("Missing supplier ID");
    if (riskScore < 0 || riskScore > 100) errors.push("Invalid risk score");
    if (errors.length) return { supplierId: supplierId || "unknown", errors };
    return null;
  }

  validateRiskRecords(
    records: SupplierRiskRecord[],
    config: SupplierRiskMonitorConfiguration,
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!config.validationRulesEnabled) return { errors, warnings };

    const seen = new Set<string>();
    for (const record of records) {
      if (seen.has(record.supplierRiskId)) {
        errors.push(`Duplicate risk record: ${record.supplierRiskId}`);
      }
      seen.add(record.supplierRiskId);
      if (!record.supplierRiskId.startsWith("srm-")) {
        errors.push(`Invalid risk record ID prefix: ${record.supplierRiskId}`);
      }
    }
    return { errors, warnings };
  }
}

export class SupplierRiskValidator {
  private readonly validationEngine = new SupplierRiskValidationEngine();

  validateRiskResult(input: {
    records: SupplierRiskRecord[];
    failures: SupplierRiskFailureFinding[];
    config: SupplierRiskMonitorConfiguration;
    startedAt: number;
  }): SupplierRiskValidationReport {
    const { errors, warnings } = this.validationEngine.validateRiskRecords(
      input.records,
      input.config,
    );
    if (input.failures.length) warnings.push(`${input.failures.length} monitoring failure(s) detected`);

    let decision: SupplierRiskValidationReport["decision"] = "pass";
    if (errors.length) decision = warnings.length ? "partial" : "fail";
    else if (warnings.length) decision = "partial";

    const validatedRecords = input.records.map((r) => ({
      ...r,
      validationStatus:
        decision === "pass" ? ("passed" as const) : decision === "partial" ? ("partial" as const) : ("failed" as const),
    }));
    input.records.splice(0, input.records.length, ...validatedRecords);

    return {
      validationReportId: `srm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - input.startedAt,
      metadataVersion: SRM_METADATA_VERSION,
    };
  }
}

export function buildRiskReportId(): string {
  return `srm-run-${Date.now()}`;
}

export class SupplierRiskMetadataGenerator {
  generateRiskReport(input: {
    action: import("./types.js").SupplierRiskReport["action"];
    records: SupplierRiskRecord[];
    failures: SupplierRiskFailureFinding[];
    invalidRecords: InvalidSupplierRiskFinding[];
    validation: SupplierRiskValidationReport;
    durationMs: number;
  }): import("./types.js").SupplierRiskReport {
    return {
      riskReportId: buildRiskReportId(),
      riskTimestamp: new Date().toISOString(),
      action: input.action,
      records: input.records,
      failures: input.failures,
      invalidRecords: input.invalidRecords,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SRM_METADATA_VERSION,
    };
  }
}
